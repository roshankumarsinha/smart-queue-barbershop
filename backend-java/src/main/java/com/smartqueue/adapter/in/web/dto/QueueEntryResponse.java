package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.ServiceType;
import com.smartqueue.domain.model.QueueEntry;

import java.time.Instant;

public record QueueEntryResponse(
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

    /** Null-tolerant: an empty chair or an empty queue serialises as JSON null. */
    public static QueueEntryResponse from(QueueEntry e) {
        if (e == null) {
            return null;
        }
        return new QueueEntryResponse(
                e.id(),
                e.shopId(),
                e.token(),
                e.customerName(),
                e.phone(),
                e.service(),
                e.status(),
                e.position(),
                e.joinedAt(),
                e.updatedAt());
    }
}
