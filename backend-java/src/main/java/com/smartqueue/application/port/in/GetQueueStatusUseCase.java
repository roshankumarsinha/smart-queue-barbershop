package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.result.QueueEntryStatus;
import com.smartqueue.application.port.in.result.QueueSnapshot;

public interface GetQueueStatusUseCase {

    QueueSnapshot snapshot(String shopId);

    /** A single customer's live status — their place in line and time remaining. */
    QueueEntryStatus entryStatus(String entryId);
}
