package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.QueueEntry;

import java.util.List;

/**
 * The complete live state of one shop's queue. This is both the REST response for
 * GET /queue/board and the payload broadcast over WebSocket after every change,
 * so the two can never drift.
 *
 * @param serving          everyone currently occupying a chair — one entry per on-duty barber
 *                         who has claimed a customer, empty if nobody is being served
 * @param onDutyStaffCount how many chairs are open right now; feeds the wait estimate
 */
public record QueueSnapshot(
        String shopId,
        List<QueueEntry> serving,
        List<QueueEntry> waiting,
        int totalWaiting,
        int onDutyStaffCount,
        int estimatedWaitMinutes) {
}
