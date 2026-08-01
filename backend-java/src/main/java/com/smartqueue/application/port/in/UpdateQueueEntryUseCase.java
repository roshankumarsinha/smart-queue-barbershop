package com.smartqueue.application.port.in;

import com.smartqueue.domain.model.QueueEntry;

public interface UpdateQueueEntryUseCase {

    /** Send the customer to the back of the waiting list. */
    QueueEntry skip(String entryId);

    /** The customer gave up and walked out. */
    QueueEntry leave(String entryId);

    /** We called them and they weren't there. */
    QueueEntry markNoShow(String entryId);
}
