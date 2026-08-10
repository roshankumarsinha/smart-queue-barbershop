package com.smartqueue.application.service;

import com.smartqueue.application.port.in.GetQueueStatusUseCase;
import com.smartqueue.application.port.in.HandleWhatsAppMessageUseCase;
import com.smartqueue.application.port.in.JoinQueueUseCase;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.UpdateQueueEntryUseCase;
import com.smartqueue.application.port.in.command.InboundWhatsAppMessage;
import com.smartqueue.application.port.in.command.JoinQueueCommand;
import com.smartqueue.application.port.in.result.JoinQueueResult;
import com.smartqueue.application.port.in.result.QueueEntryStatus;
import com.smartqueue.application.port.out.QueueEntryRepository;
import com.smartqueue.application.port.out.WhatsAppClient;
import com.smartqueue.application.port.out.WhatsAppClient.Button;
import com.smartqueue.application.port.out.WhatsAppClient.ListRow;
import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.ServiceType;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.model.Shop;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Drives the "message Hi to join a queue" WhatsApp flow: greet -> pick a service ->
 * pick a shop -> join. Each phone number's progress through that flow lives in an
 * in-memory map — acceptable because losing it on a restart just means the customer
 * has to say Hi again, which is also how they'd recover from getting stuck anywhere
 * else in the conversation.
 */
@Service
public class WhatsAppConversationService implements HandleWhatsAppMessageUseCase {

    private static final Set<String> GREETINGS = Set.of("hi", "hello", "hey", "start", "menu");
    private static final String STATUS_COMMAND = "status";
    private static final String LEAVE_COMMAND = "leave";
    private static final String HELP_MESSAGE =
            "Reply Hi to join a queue, or Status to check where you're at.";

    private enum Step {
        AWAITING_SERVICE,
        AWAITING_SHOP
    }

    private record Conversation(Step step, ServiceType service) {
    }

    private final ConcurrentHashMap<String, Conversation> conversations = new ConcurrentHashMap<>();

    private final JoinQueueUseCase join;
    private final ManageShopsUseCase shops;
    private final GetQueueStatusUseCase status;
    private final UpdateQueueEntryUseCase update;
    private final QueueEntryRepository entries;
    private final WhatsAppClient whatsapp;

    public WhatsAppConversationService(
            JoinQueueUseCase join,
            ManageShopsUseCase shops,
            GetQueueStatusUseCase status,
            UpdateQueueEntryUseCase update,
            QueueEntryRepository entries,
            WhatsAppClient whatsapp) {
        this.join = join;
        this.shops = shops;
        this.status = status;
        this.update = update;
        this.entries = entries;
        this.whatsapp = whatsapp;
    }

    @Override
    public void handle(InboundWhatsAppMessage message) {
        String phone = message.from();

        if (message.isInteractiveReply()) {
            handleReply(phone, message.interactiveReplyId());
            return;
        }

        String normalized = message.text() == null ? "" : message.text().trim().toLowerCase(Locale.ROOT);
        if (GREETINGS.contains(normalized)) {
            startFlow(phone);
        } else if (STATUS_COMMAND.equals(normalized)) {
            sendStatus(phone);
        } else {
            whatsapp.sendText(phone, HELP_MESSAGE);
        }
    }

    private void startFlow(String phone) {
        conversations.put(phone, new Conversation(Step.AWAITING_SERVICE, null));
        List<ListRow> rows = Arrays.stream(ServiceType.values())
                .map(s -> new ListRow(s.name(), label(s), null))
                .toList();
        whatsapp.sendList(phone, "Welcome! What service would you like?", "Select", rows);
    }

    /**
     * Status/Leave are quick actions available any time, not just mid-flow — they come
     * back as the same {@code replyId} whether tapped from the post-join buttons or
     * (in principle) anywhere else, so they're checked before the step-based menu logic
     * rather than being tied to a particular {@link Conversation} state.
     */
    private void handleReply(String phone, String replyId) {
        if (STATUS_COMMAND.equals(replyId)) {
            sendStatus(phone);
            return;
        }
        if (LEAVE_COMMAND.equals(replyId)) {
            handleLeave(phone);
            return;
        }

        Conversation conv = conversations.get(phone);
        if (conv == null) {
            whatsapp.sendText(phone, "That menu expired. Reply Hi to start over.");
            return;
        }
        switch (conv.step()) {
            case AWAITING_SERVICE -> handleServiceSelected(phone, replyId);
            case AWAITING_SHOP -> handleShopSelected(phone, conv.service(), replyId);
        }
    }

    private void handleServiceSelected(String phone, String replyId) {
        ServiceType service;
        try {
            service = ServiceType.valueOf(replyId);
        } catch (IllegalArgumentException e) {
            conversations.remove(phone);
            whatsapp.sendText(phone, "Sorry, I didn't recognise that. Reply Hi to start over.");
            return;
        }

        List<Shop> open = shops.findAll();
        if (open.isEmpty()) {
            conversations.remove(phone);
            whatsapp.sendText(phone, "No shops are open right now — please try again later.");
            return;
        }

        conversations.put(phone, new Conversation(Step.AWAITING_SHOP, service));
        // Meta's list message caps a section at 10 rows; a platform with more open
        // shops than that needs a smarter picker (search, pagination) than this bot has.
        List<ListRow> rows = open.stream()
                .limit(10)
                .map(shop -> new ListRow(shop.id(), shop.name(), shopDescription(shop)))
                .toList();
        whatsapp.sendList(phone, "Great — which shop?", "Select", rows);
    }

    private void handleShopSelected(String phone, ServiceType service, String shopId) {
        conversations.remove(phone);
        JoinQueueResult result;
        try {
            result = join.join(new JoinQueueCommand(shopId, service, phone, null));
        } catch (NotFoundException e) {
            whatsapp.sendText(phone, "Sorry, that shop isn't available anymore. Reply Hi to start over.");
            return;
        } catch (ConflictException e) {
            whatsapp.sendText(phone, e.getMessage() + ". Reply Hi to try another shop.");
            return;
        }
        // join() already sent the "You're token #N..." JOINED notification —
        // see CustomerNotificationService — this is the follow-up with quick actions.
        whatsapp.sendButtons(
                phone, "You're token #%d.".formatted(result.entry().token()), queueActionButtons());
    }

    /**
     * Re-attaches the same Check Status / Leave Queue buttons every time, not just
     * right after joining — a customer should be able to keep checking back later
     * without having to remember to type "status" from scratch.
     */
    private void sendStatus(String phone) {
        entries.findActiveByPhone(phone).ifPresentOrElse(
                entry -> whatsapp.sendButtons(
                        phone, statusMessage(status.entryStatus(entry.id())), queueActionButtons()),
                () -> whatsapp.sendText(phone, "You don't have an active queue spot. Reply Hi to join one."));
    }

    private static List<Button> queueActionButtons() {
        return List.of(new Button(STATUS_COMMAND, "Check Status"), new Button(LEAVE_COMMAND, "Leave Queue"));
    }

    /**
     * Same phone-based lookup as {@link #sendStatus} — a customer only has one active
     * spot in this flow, so there's no entry id to disambiguate with.
     */
    private void handleLeave(String phone) {
        entries.findActiveByPhone(phone).ifPresentOrElse(
                entry -> update.leave(entry.id()), // sends its own "You have left the queue" notification
                () -> whatsapp.sendText(phone, "You don't have an active queue spot to leave."));
    }

    private String shopDescription(Shop shop) {
        var snapshot = status.snapshot(shop.id());
        return snapshot.totalWaiting() == 0
                ? "No wait right now"
                : "%d waiting · ~%d min".formatted(snapshot.totalWaiting(), snapshot.estimatedWaitMinutes());
    }

    private static String statusMessage(QueueEntryStatus s) {
        if (s.entry().status() == QueueStatus.IN_SERVICE) {
            return "You're up! Token #%d — head to the chair.".formatted(s.entry().token());
        }
        return "Token #%d — %d ahead of you, ~%d min wait."
                .formatted(s.entry().token(), s.ahead(), s.estimatedWaitMinutes());
    }

    private static String label(ServiceType s) {
        return switch (s) {
            case HAIRCUT -> "Haircut";
            case BEARD -> "Beard";
            case HAIRCUT_BEARD -> "Haircut + Beard";
        };
    }
}
