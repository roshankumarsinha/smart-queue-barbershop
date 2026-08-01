package com.smartqueue.application.port.out;

import com.smartqueue.domain.NotificationType;

/**
 * Outbound seam for customer messaging. The default adapter logs instead of sending
 * so development costs nothing and needs no external account; swapping in a real
 * WhatsApp Cloud API client is a one-class change with no impact on the queue logic.
 */
public interface NotificationSender {

    /** @param phone may be null — the customer joined without leaving a number. */
    void send(String phone, NotificationType type, String message);
}
