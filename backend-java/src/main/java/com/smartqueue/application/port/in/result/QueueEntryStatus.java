package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.QueueEntry;

/**
 * One customer's live status: their entry, how many are still ahead of them, and the
 * updated wait estimate. What a customer polls for after joining.
 *
 * @param ahead customers (including whoever is in the chair) still ahead; always 0 once
 *              this entry is no longer WAITING
 */
public record QueueEntryStatus(QueueEntry entry, int ahead, int estimatedWaitMinutes) {
}
