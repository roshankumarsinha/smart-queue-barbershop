package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.AdvanceQueueResult;

public record AdvanceQueueResponse(QueueEntryResponse served, QueueEntryResponse nowServing) {

    public static AdvanceQueueResponse from(AdvanceQueueResult r) {
        return new AdvanceQueueResponse(
                QueueEntryResponse.from(r.served()), QueueEntryResponse.from(r.nowServing()));
    }
}
