package com.smartqueue.application.service;

import com.smartqueue.application.port.in.AdvanceQueueUseCase;
import com.smartqueue.application.port.in.GetQueueStatusUseCase;
import com.smartqueue.application.port.in.JoinQueueUseCase;
import com.smartqueue.application.port.in.NotifyCustomerUseCase;
import com.smartqueue.application.port.in.UpdateQueueEntryUseCase;
import com.smartqueue.application.port.in.command.JoinQueueCommand;
import com.smartqueue.application.port.in.command.NotifyCustomerCommand;
import com.smartqueue.application.port.in.result.AdvanceQueueResult;
import com.smartqueue.application.port.in.result.JoinQueueResult;
import com.smartqueue.application.port.in.result.QueueSnapshot;
import com.smartqueue.application.port.out.QueueEntryRepository;
import com.smartqueue.application.port.out.QueueEventPublisher;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.domain.NotificationType;
import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.model.QueueEntry;
import com.smartqueue.domain.model.Shop;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Every queue operation lives here. Each mutation ends by broadcasting a fresh
 * snapshot, so the dashboard and the customer's phone always agree on the state.
 */
@Service
@Transactional
public class QueueService
        implements GetQueueStatusUseCase,
                JoinQueueUseCase,
                AdvanceQueueUseCase,
                UpdateQueueEntryUseCase,
                NotifyCustomerUseCase {

    private static final String DEFAULT_MESSAGE = "Update from your barbershop.";

    private final ShopRepository shops;
    private final QueueEntryRepository entries;
    private final CustomerNotificationService notifications;
    private final QueueEventPublisher events;

    public QueueService(
            ShopRepository shops,
            QueueEntryRepository entries,
            CustomerNotificationService notifications,
            QueueEventPublisher events) {
        this.shops = shops;
        this.entries = entries;
        this.notifications = notifications;
        this.events = events;
    }

    // --- Reads -----------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public QueueSnapshot snapshot(String shopId) {
        Shop shop = requireShop(shopId);
        QueueEntry serving = entries.findFirstByStatus(shopId, QueueStatus.IN_SERVICE).orElse(null);
        List<QueueEntry> waiting = entries.findWaitingOrdered(shopId);

        return new QueueSnapshot(
                shopId,
                serving,
                waiting,
                waiting.size(),
                shop.avgServiceTime(),
                shop.estimatedWaitMinutes(waiting.size()));
    }

    // --- Writes ----------------------------------------------------------------

    /** Customer self-join (normally via WhatsApp) and staff walk-in share this path. */
    @Override
    public JoinQueueResult join(JoinQueueCommand command) {
        Shop shop = requireShop(command.shopId());

        int token = entries.highestToken(shop.id()).orElse(0) + 1;
        int position = entries.highestActivePosition(shop.id()).orElse(0) + 1;

        QueueEntry entry = entries.save(QueueEntry.joining(
                shop.id(), token, position, command.service(), command.phone(), command.name()));

        int ahead = entries.countActiveAhead(shop.id(), entry.position());
        int wait = shop.estimatedWaitMinutes(ahead);

        notifications.notify(
                entry,
                NotificationType.JOINED,
                "You're token #%d. %d ahead of you, ~%d min wait.".formatted(entry.token(), ahead, wait));
        broadcast(shop.id());

        return new JoinQueueResult(entry, ahead, wait);
    }

    @Override
    public AdvanceQueueResult advance(String shopId) {
        requireShop(shopId);

        // Complete whoever is currently in the chair.
        QueueEntry served = entries.findFirstByStatus(shopId, QueueStatus.IN_SERVICE)
                .map(current -> entries.save(current.withStatus(QueueStatus.DONE)))
                .orElse(null);

        // Promote the next customer waiting.
        QueueEntry nowServing = entries.findFirstByStatus(shopId, QueueStatus.WAITING)
                .map(next -> entries.save(next.withStatus(QueueStatus.IN_SERVICE)))
                .orElse(null);

        if (nowServing != null) {
            notifications.notify(
                    nowServing,
                    NotificationType.YOUR_TURN,
                    "It's your turn! Please head to the chair (token #%d).".formatted(nowServing.token()));

            // Give the following customer a heads-up so they start walking over.
            entries.findFirstByStatus(shopId, QueueStatus.WAITING)
                    .ifPresent(onDeck -> notifications.notify(
                            onDeck,
                            NotificationType.ALMOST_YOUR_TURN,
                            "You're next (token #%d). Start heading over.".formatted(onDeck.token())));
        }

        broadcast(shopId);
        return new AdvanceQueueResult(served, nowServing);
    }

    @Override
    public QueueEntry skip(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        int back = entries.highestActivePosition(entry.shopId()).orElse(0) + 1;

        QueueEntry updated = entries.save(entry.requeuedAt(back));
        broadcast(entry.shopId());
        return updated;
    }

    @Override
    public QueueEntry leave(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        QueueEntry updated = entries.save(entry.withStatus(QueueStatus.LEFT));

        notifications.notify(
                updated, NotificationType.REMOVED, "You have left the queue. Message us again to rejoin.");
        broadcast(entry.shopId());
        return updated;
    }

    @Override
    public QueueEntry markNoShow(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        QueueEntry updated = entries.save(entry.withStatus(QueueStatus.NO_SHOW));

        broadcast(entry.shopId());
        return updated;
    }

    @Override
    public void notifyCustomer(NotifyCustomerCommand command) {
        QueueEntry entry = requireEntry(command.entryId());
        notifications.notify(
                entry, command.type(), Optional.ofNullable(command.message()).orElse(DEFAULT_MESSAGE));
    }

    // --- Helpers ---------------------------------------------------------------

    private Shop requireShop(String shopId) {
        return shops.findById(shopId).orElseThrow(() -> new NotFoundException("Shop not found"));
    }

    private QueueEntry requireEntry(String entryId) {
        return entries.findById(entryId).orElseThrow(() -> new NotFoundException("Queue entry not found"));
    }

    private void broadcast(String shopId) {
        events.publishQueueUpdate(shopId, snapshot(shopId));
    }
}
