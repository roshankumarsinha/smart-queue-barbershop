package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.JoinQueueResult;

public record JoinQueueResponse(QueueEntryResponse entry, int ahead, int estimatedWaitMinutes) {

    public static JoinQueueResponse from(JoinQueueResult r) {
        return new JoinQueueResponse(
                QueueEntryResponse.from(r.entry()), r.ahead(), r.estimatedWaitMinutes());
    }
}
