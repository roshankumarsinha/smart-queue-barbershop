package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.QueueEntry;

public record JoinQueueResult(QueueEntry entry, int ahead, int estimatedWaitMinutes) {
}
