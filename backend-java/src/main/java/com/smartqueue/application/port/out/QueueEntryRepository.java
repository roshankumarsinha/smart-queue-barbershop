package com.smartqueue.application.port.out;

import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.model.QueueEntry;

import java.util.List;
import java.util.Optional;

public interface QueueEntryRepository {

    Optional<QueueEntry> findById(String entryId);

    /** The single entry currently in the given status, ordered by position then join time. */
    Optional<QueueEntry> findFirstByStatus(String shopId, QueueStatus status);

    /** Everyone still waiting, in the order they will be served. */
    List<QueueEntry> findWaitingOrdered(String shopId);

    /** How many active customers sit in front of this position. */
    int countActiveAhead(String shopId, int position);

    /** Highest token ever issued by this shop — tokens never get reused. */
    Optional<Integer> highestToken(String shopId);

    /** Highest position among active entries — the back of the current queue. */
    Optional<Integer> highestActivePosition(String shopId);

    QueueEntry save(QueueEntry entry);
}
