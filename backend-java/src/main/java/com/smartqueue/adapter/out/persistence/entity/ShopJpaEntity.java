package com.smartqueue.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "shops")
public class ShopJpaEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "whatsapp_number")
    private String whatsappNumber;

    @Column
    private String address;

    @Column(name = "avg_service_time", nullable = false)
    private int avgServiceTime;

    @Column(nullable = false)
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ShopJpaEntity() {
        // for JPA
    }

    public ShopJpaEntity(
            String id,
            String name,
            String whatsappNumber,
            String address,
            int avgServiceTime,
            boolean active,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.whatsappNumber = whatsappNumber;
        this.address = address;
        this.avgServiceTime = avgServiceTime;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getWhatsappNumber() {
        return whatsappNumber;
    }

    public String getAddress() {
        return address;
    }

    public int getAvgServiceTime() {
        return avgServiceTime;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
