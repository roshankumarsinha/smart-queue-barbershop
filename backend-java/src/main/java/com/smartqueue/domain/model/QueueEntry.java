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
        Instant updatedAt,
        String servedBy) {

    /** A not-yet-persisted entry at the back of the queue, not yet claimed by anyone. */
    public static QueueEntry joining(
            String shopId, int token, int position, ServiceType service, String phone, String customerName) {
        return new QueueEntry(
                null, shopId, token, customerName, phone, service, QueueStatus.WAITING, position, null, null, null);
    }

    /**
     * A status change that doesn't touch who's serving this entry — {@code servedBy} is kept as
     * a historical record (e.g. still set once a customer is DONE), not cleared on completion.
     */
    public QueueEntry withStatus(QueueStatus newStatus) {
        return new QueueEntry(
                id, shopId, token, customerName, phone, service, newStatus, position, joinedAt, updatedAt, servedBy);
    }

    /** A barber claims this entry into their chair. */
    public QueueEntry claimedBy(String staffId) {
        return new QueueEntry(
                id, shopId, token, customerName, phone, service,
                QueueStatus.IN_SERVICE, position, joinedAt, updatedAt, staffId);
    }

    /** Send this customer back to the end of the waiting list, unclaimed. */
    public QueueEntry requeuedAt(int newPosition) {
        return new QueueEntry(
                id, shopId, token, customerName, phone, service,
                QueueStatus.WAITING, newPosition, joinedAt, updatedAt, null);
    }
}
