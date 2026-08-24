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
import com.smartqueue.application.port.in.result.QueueEntryStatus;
import com.smartqueue.application.port.in.result.QueueSnapshot;
import com.smartqueue.application.port.out.QueueEntryRepository;
import com.smartqueue.application.port.out.QueueEventPublisher;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.NotificationType;
import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.model.QueueEntry;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;
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

    /** A waiting customer gets an ALMOST_YOUR_TURN nudge once their own estimate drops below this. */
    private static final int HEADS_UP_THRESHOLD_MINUTES = 30;

    private final ShopRepository shops;
    private final QueueEntryRepository entries;
    private final UserRepository users;
    private final CustomerNotificationService notifications;
    private final QueueEventPublisher events;

    public QueueService(
            ShopRepository shops,
            QueueEntryRepository entries,
            UserRepository users,
            CustomerNotificationService notifications,
            QueueEventPublisher events) {
        this.shops = shops;
        this.entries = entries;
        this.users = users;
        this.notifications = notifications;
        this.events = events;
    }

    // --- Reads -----------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public QueueSnapshot snapshot(String shopId) {
        Shop shop = requireShop(shopId);
        List<QueueEntry> serving = entries.findAllByStatus(shopId, QueueStatus.IN_SERVICE);
        List<QueueEntry> waiting = entries.findWaitingOrdered(shopId);
        int onDutyCount = onDutyCount(shop);

        return new QueueSnapshot(
                shopId,
                serving,
                waiting,
                waiting.size(),
                onDutyCount,
                shop.estimatedWaitMinutes(waiting.size(), serving.size(), onDutyCount));
    }

    /**
     * Ahead/wait are only meaningful while WAITING — an entry already IN_SERVICE has
     * nobody left ahead of it, and one that's DONE/LEFT/NO_SHOW has nothing left to wait
     * for, so both read as zero rather than a stale figure from before the status changed.
     */
    @Override
    @Transactional(readOnly = true)
    public QueueEntryStatus entryStatus(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        if (entry.status() != QueueStatus.WAITING) {
            return new QueueEntryStatus(entry, 0, 0);
        }

        Shop shop = requireShop(entry.shopId());
        int ahead = entries.countWaitingAhead(shop.id(), entry.position());
        int wait = shop.estimatedWaitMinutes(ahead, occupiedChairCount(shop.id()), onDutyCount(shop));
        return new QueueEntryStatus(entry, ahead, wait);
    }

    // --- Writes ----------------------------------------------------------------

    /**
     * Customer self-join (normally via WhatsApp) and staff walk-in share this path — a
     * closed shop rejects both, since neither a customer messaging in nor staff adding a
     * walk-in should be able to queue up somewhere that isn't taking customers.
     */
    @Override
    public JoinQueueResult join(JoinQueueCommand command) {
        Shop shop = requireShop(command.shopId());
        if (!shop.active()) {
            throw new ConflictException("This shop is currently closed");
        }

        int token = entries.highestToken(shop.id()).orElse(0) + 1;
        int position = entries.highestActivePosition(shop.id()).orElse(0) + 1;

        QueueEntry entry = entries.save(QueueEntry.joining(
                shop.id(), token, position, command.service(), command.phone(), command.name()));

        int ahead = entries.countWaitingAhead(shop.id(), entry.position());
        int wait = shop.estimatedWaitMinutes(ahead, occupiedChairCount(shop.id()), onDutyCount(shop));

        notifications.notify(
                entry,
                NotificationType.JOINED,
                "You're token #%d. %d ahead of you, ~%d min wait.".formatted(entry.token(), ahead, wait));
        broadcast(shop.id());

        return new JoinQueueResult(entry, ahead, wait);
    }

    @Override
    public AdvanceQueueResult advance(String shopId, String staffId, Integer requestedToken) {
        Shop shop = requireShop(shopId);
        requireOnDutyChairHolder(shop, staffId);

        // Claim first (before completing anyone), so an invalid requested token fails the
        // whole call cleanly — the barber's current customer isn't marked DONE unless a
        // next customer was actually found to replace them.
        Optional<QueueEntry> claimed = requestedToken != null
                ? entries.lockWaitingByToken(shopId, requestedToken)
                : entries.lockNextWaiting(shopId);
        if (requestedToken != null && claimed.isEmpty()) {
            throw new NotFoundException("No waiting customer with token #" + requestedToken);
        }

        // Complete whoever is currently in this barber's chair.
        QueueEntry served = entries.findActiveByServedBy(staffId)
                .map(current -> entries.save(current.withStatus(QueueStatus.DONE)))
                .orElse(null);

        // Locked so two barbers pressing "Next" at once can't both claim the same customer.
        QueueEntry nowServing = claimed
                .map(next -> entries.save(next.claimedBy(staffId)))
                .orElse(null);

        if (nowServing != null) {
            notifications.notify(
                    nowServing,
                    NotificationType.YOUR_TURN,
                    "It's your turn! Please head to the chair (token #%d).".formatted(nowServing.token()));
        }

        // Whoever is now at the front of the line has moved up — tell them, even when
        // nobody was promoted (an empty chair with people still waiting can't happen
        // here, but this keeps the two code paths from silently diverging later).
        notifyOnDeck(shop);

        broadcast(shopId);
        return new AdvanceQueueResult(served, nowServing);
    }

    /**
     * Skipping moves this entry to the back. That only pulls the front of the line
     * forward when the skipped entry was itself in it — someone at position 5 skipping
     * doesn't change who's #1 or #2, so nothing is re-sent in that case.
     */
    @Override
    public QueueEntry skip(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        Shop shop = requireShop(entry.shopId());
        boolean wasOnDeck = isOnDeck(shop, entry);
        int back = entries.highestActivePosition(shop.id()).orElse(0) + 1;

        QueueEntry updated = entries.save(entry.requeuedAt(back));
        if (wasOnDeck) {
            notifyOnDeck(shop);
        }
        broadcast(shop.id());
        return updated;
    }

    /** Leaving drops this entry out of the active queue; see {@link #skip} for why this is conditional. */
    @Override
    public QueueEntry leave(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        Shop shop = requireShop(entry.shopId());
        boolean wasOnDeck = isOnDeck(shop, entry);
        QueueEntry updated = entries.save(entry.withStatus(QueueStatus.LEFT));

        notifications.notify(
                updated, NotificationType.REMOVED, "You have left the queue. Message us again to rejoin.");
        if (wasOnDeck) {
            notifyOnDeck(shop);
        }
        broadcast(shop.id());
        return updated;
    }

    /** A no-show drops this entry out of the active queue; see {@link #skip} for why this is conditional. */
    @Override
    public QueueEntry markNoShow(String entryId) {
        QueueEntry entry = requireEntry(entryId);
        Shop shop = requireShop(entry.shopId());
        boolean wasOnDeck = isOnDeck(shop, entry);
        QueueEntry updated = entries.save(entry.withStatus(QueueStatus.NO_SHOW));

        if (wasOnDeck) {
            notifyOnDeck(shop);
        }
        broadcast(shop.id());
        return updated;
    }

    @Override
    public void notifyCustomer(NotifyCustomerCommand command) {
        QueueEntry entry = requireEntry(command.entryId());
        notifications.notify(
                entry, command.type(), Optional.ofNullable(command.message()).orElse(DEFAULT_MESSAGE));
    }

    // --- Helpers ---------------------------------------------------------------

    /**
     * How many chairs this shop currently has open — its on-duty barbers, plus its owner if
     * they're also working the floor (an owner can go on duty just like a barber).
     */
    private int onDutyCount(Shop shop) {
        int barbers = users.findByShopIdAndRoleAndOnDutyTrue(shop.id(), Role.BARBER_STAFF).size();
        boolean ownerOnDuty = users.findById(shop.ownerId()).map(User::onDuty).orElse(false);
        return barbers + (ownerOnDuty ? 1 : 0);
    }

    /** How many of those chairs are occupied right now — feeds the half-weight in the wait estimate. */
    private int occupiedChairCount(String shopId) {
        return entries.findAllByStatus(shopId, QueueStatus.IN_SERVICE).size();
    }

    /**
     * {@code userId} must be an on-duty chair-holder of this shop — one of its barbers, or
     * the shop's own owner — or advancing makes no sense.
     */
    private User requireOnDutyChairHolder(Shop shop, String userId) {
        User user = users.findById(userId)
                .filter(u -> isChairEligible(shop, u))
                .orElseThrow(() -> new NotFoundException("Staff not found"));
        if (!user.onDuty()) {
            throw new ConflictException("You must be on duty to serve customers");
        }
        return user;
    }

    private static boolean isChairEligible(Shop shop, User user) {
        boolean isBarberHere = user.role() == Role.BARBER_STAFF && shop.id().equals(user.shopId());
        boolean isThisOwner = user.role() == Role.SHOP_OWNER && user.id().equals(shop.ownerId());
        return isBarberHere || isThisOwner;
    }

    /**
     * True if this entry's own estimated wait is under {@link #HEADS_UP_THRESHOLD_MINUTES} —
     * i.e. removing or requeuing it will actually change who's about to be nudged. Built from
     * the same formula {@link #notifyOnDeck} uses, so the two are consistent by construction.
     * Must be checked before the entry is mutated — a WAITING entry that's about to be
     * skipped/left/no-shown still needs to be found in its current spot.
     */
    private boolean isOnDeck(Shop shop, QueueEntry entry) {
        if (entry.status() != QueueStatus.WAITING) {
            return false;
        }
        int ahead = entries.countWaitingAhead(shop.id(), entry.position());
        int wait = shop.estimatedWaitMinutes(ahead, occupiedChairCount(shop.id()), onDutyCount(shop));
        return wait <= HEADS_UP_THRESHOLD_MINUTES;
    }

    /**
     * Nudges every waiting customer whose own estimated wait has dropped under
     * {@link #HEADS_UP_THRESHOLD_MINUTES} — how many people that is scales with how many
     * chairs are open, unlike a fixed headcount. Called after any mutation that changes who's
     * at the front — advancing always does; skipping, leaving, and a no-show only when the
     * departing entry was itself on deck (see {@link #isOnDeck}).
     */
    private void notifyOnDeck(Shop shop) {
        int onDutyCount = onDutyCount(shop);
        int occupiedChairs = occupiedChairCount(shop.id());
        List<QueueEntry> waiting = entries.findWaitingOrdered(shop.id());
        for (int i = 0; i < waiting.size(); i++) {
            QueueEntry next = waiting.get(i);
            int ahead = entries.countWaitingAhead(shop.id(), next.position());
            int waitMinutes = shop.estimatedWaitMinutes(ahead, occupiedChairs, onDutyCount);
            if (waitMinutes > HEADS_UP_THRESHOLD_MINUTES) {
                // Position-ordered list, so wait time only grows from here on — nobody
                // further back can be under the threshold either.
                break;
            }
            notifications.notify(next, NotificationType.ALMOST_YOUR_TURN, headsUpMessage(next, i + 1, waitMinutes));
        }
    }

    /** Only the customer at the front is told to start moving; the one behind just gets the estimate. */
    private static String headsUpMessage(QueueEntry entry, int placeInLine, int waitMinutes) {
        return placeInLine == 1
                ? "You're next (token #%d), about %d min. Start heading over.".formatted(entry.token(), waitMinutes)
                : "You're #%d in line (token #%d), about %d min."
                        .formatted(placeInLine, entry.token(), waitMinutes);
    }

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
