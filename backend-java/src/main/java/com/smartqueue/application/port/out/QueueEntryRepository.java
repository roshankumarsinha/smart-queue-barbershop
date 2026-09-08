package com.smartqueue.application.port.out;

import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.model.QueueEntry;

import java.util.List;
import java.util.Optional;

public interface QueueEntryRepository {

    Optional<QueueEntry> findById(String entryId);

    /** The single entry currently in the given status, ordered by position then join time. */
    Optional<QueueEntry> findFirstByStatus(String shopId, QueueStatus status);

    /** Every entry currently in the given status — e.g. all the shop's occupied chairs. */
    List<QueueEntry> findAllByStatus(String shopId, QueueStatus status);

    /** The entry this barber is currently serving, if any. */
    Optional<QueueEntry> findActiveByServedBy(String staffId);

    /**
     * Claims the earliest WAITING entry under a row lock, so two barbers pressing "Next" at
     * the same moment can't both claim the same customer — the second transaction blocks on
     * this row, then re-reads once the first commits and naturally sees it's no longer WAITING.
     */
    Optional<QueueEntry> lockNextWaiting(String shopId);

    /**
     * Same locking guarantee as {@link #lockNextWaiting}, but for a specific token — a barber
     * choosing to serve a customer out of turn (e.g. an earlier token hasn't shown up yet).
     * Empty if that token doesn't exist or isn't currently WAITING.
     */
    Optional<QueueEntry> lockWaitingByToken(String shopId, int token);

    /** Everyone still waiting, in the order they will be served. */
    List<QueueEntry> findWaitingOrdered(String shopId);

    /**
     * This phone's most recent WAITING/IN_SERVICE entry, across any shop — how the
     * WhatsApp bot answers "what's my status" without the customer supplying an id.
     */
    Optional<QueueEntry> findActiveByPhone(String phone);

    /**
     * How many customers still WAITING sit in front of this position — the basis for wait-time
     * estimates. Someone already IN_SERVICE has left the waiting line, so they don't count here;
     * with multiple chairs, dividing this by chair count is what makes the estimate meaningful.
     */
    int countWaitingAhead(String shopId, int position);

    /**
     * Highest token issued by this shop in the given token cycle — tokens never get reused
     * within a cycle, but a new cycle (started when the shop closes, see {@code Shop#closed})
     * restarts numbering from scratch.
     */
    Optional<Integer> highestToken(String shopId, int tokenCycle);

    /** Highest position among active entries — the back of the current queue. */
    Optional<Integer> highestActivePosition(String shopId);

    QueueEntry save(QueueEntry entry);
}
