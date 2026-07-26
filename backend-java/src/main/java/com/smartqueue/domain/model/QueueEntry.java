package com.smartqueue.domain.model;

import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.ServiceType;

import java.time.Instant;

/**
 * One customer's place in a shop's queue. {@code token} is the human-facing number
 * ("you are #14"); {@code position} is the ordering key we actually sort on, which
 * changes when a customer is skipped to the back.
 */
public record QueueEntry(
        String id,
        String shopId,
        int token,
        String customerName,
        String phone,
        ServiceType service,
        QueueStatus status,
        int position,
        Instant joinedAt,
        Instant updatedAt) {

    /** A not-yet-persisted entry at the back of the queue. */
    public static QueueEntry joining(
            String shopId, int token, int position, ServiceType service, String phone, String customerName) {
        return new QueueEntry(
                null, shopId, token, customerName, phone, service, QueueStatus.WAITING, position, null, null);
    }

    public QueueEntry withStatus(QueueStatus newStatus) {
        return new QueueEntry(
                id, shopId, token, customerName, phone, service, newStatus, position, joinedAt, updatedAt);
    }

    /** Send this customer back to the end of the waiting list. */
    public QueueEntry requeuedAt(int newPosition) {
        return new QueueEntry(
                id, shopId, token, customerName, phone, service, QueueStatus.WAITING, newPosition, joinedAt, updatedAt);
    }
}
