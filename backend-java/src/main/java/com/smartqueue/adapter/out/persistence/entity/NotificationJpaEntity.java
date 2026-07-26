package com.smartqueue.adapter.out.persistence.entity;

import com.smartqueue.domain.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notifications")
public class NotificationJpaEntity {

    @Id
    private String id;

    @Column(name = "queue_entry_id", nullable = false)
    private String queueEntryId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    @Column(nullable = false, length = 32)
    private String channel;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    protected NotificationJpaEntity() {
        // for JPA
    }

    public NotificationJpaEntity(
            String id, String queueEntryId, NotificationType type, String channel, Instant sentAt) {
        this.id = id;
        this.queueEntryId = queueEntryId;
        this.type = type;
        this.channel = channel;
        this.sentAt = sentAt;
    }

    public String getId() {
        return id;
    }

    public String getQueueEntryId() {
        return queueEntryId;
    }

    public NotificationType getType() {
        return type;
    }

    public String getChannel() {
        return channel;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
