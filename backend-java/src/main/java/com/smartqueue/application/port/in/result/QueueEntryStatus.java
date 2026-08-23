package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.QueueEntry;

/**
 * One customer's live status: their entry, how many are still ahead of them, and the
 * updated wait estimate. What a customer polls for after joining.
 *
 * @param ahead customers still WAITING ahead of this one — whoever's already in a chair has
 *              left the waiting line, so they don't count; always 0 once this entry is no
 *              longer WAITING itself
 */
public record QueueEntryStatus(QueueEntry entry, int ahead, int estimatedWaitMinutes) {
}
