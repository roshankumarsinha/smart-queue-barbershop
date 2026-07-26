package com.smartqueue.application.port.in.command;

import com.smartqueue.domain.NotificationType;

/** {@code message} may be null — the application supplies a generic fallback. */
public record NotifyCustomerCommand(String entryId, NotificationType type, String message) {
}
