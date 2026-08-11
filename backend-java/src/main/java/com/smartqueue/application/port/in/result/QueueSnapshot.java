package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.QueueEntry;

import java.util.List;

/**
 * The complete live state of one shop's queue. This is both the REST response for
 * GET /queue/board and the payload broadcast over WebSocket after every change,
 * so the two can never drift.
 *
 * @param serving the customer in the chair, or null if nobody is being served
 */
public record QueueSnapshot(
        String shopId,
        QueueEntry serving,
        List<QueueEntry> waiting,
        int totalWaiting,
        int estimatedWaitMinutes) {
}
