package com.smartqueue.adapter.out.persistence.entity;

import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.ServiceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "queue_entries",
        indexes = @Index(name = "idx_queue_entries_shop_status", columnList = "shop_id, status"))
public class QueueEntryJpaEntity {

    @Id
    private String id;

    @Column(name = "shop_id", nullable = false)
    private String shopId;

    /** Human-facing token number, unique per shop and never reused. */
    @Column(nullable = false)
    private int token;

    @Column(name = "customer_name")
    private String customerName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ServiceType service;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QueueStatus status;

    /** Named to dodge POSITION, which is a reserved word in the SQL standard. */
    @Column(name = "queue_position", nullable = false)
    private int position;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected QueueEntryJpaEntity() {
        // for JPA
    }

    public QueueEntryJpaEntity(
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
        this.id = id;
        this.shopId = shopId;
        this.token = token;
        this.customerName = customerName;
        this.phone = phone;
        this.service = service;
        this.status = status;
        this.position = position;
        this.joinedAt = joinedAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getShopId() {
        return shopId;
    }

    public int getToken() {
        return token;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getPhone() {
        return phone;
    }

    public ServiceType getService() {
        return service;
    }

    public QueueStatus getStatus() {
        return status;
    }

    public int getPosition() {
        return position;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
