package com.smartqueue.domain.model;

import com.smartqueue.domain.NotificationType;

import java.time.Instant;

/** An audit row: we told this customer something, on this channel, at this time. */
public record Notification(
        String id,
        String queueEntryId,
        NotificationType type,
        String channel,
        Instant sentAt) {

    public static final String CHANNEL_WHATSAPP = "whatsapp";

    public static Notification sent(String queueEntryId, NotificationType type) {
        return new Notification(null, queueEntryId, type, CHANNEL_WHATSAPP, null);
    }
}
