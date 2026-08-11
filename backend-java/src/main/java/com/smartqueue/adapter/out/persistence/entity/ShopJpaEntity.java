package com.smartqueue.adapter.out.persistence.entity;

import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.ShopType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "shops")
public class ShopJpaEntity {

    @Id
    private String id;

    /** The SHOP_OWNER user that owns this shop; null for legacy/unassigned shops. */
    @Column(name = "owner_id")
    private String ownerId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ShopType type;

    @Column(name = "whatsapp_number")
    private String whatsappNumber;

    @Column
    private String phone;

    @Column
    private String address;

    @Column(name = "location_url")
    private String locationUrl;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ShopStatus status;

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
            String ownerId,
            String name,
            ShopType type,
            String whatsappNumber,
            String phone,
            String address,
            String locationUrl,
            LocalTime openingTime,
            LocalTime closingTime,
            ShopStatus status,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.type = type;
        this.whatsappNumber = whatsappNumber;
        this.phone = phone;
        this.address = address;
        this.locationUrl = locationUrl;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public String getName() {
        return name;
    }

    public ShopType getType() {
        return type;
    }

    public String getWhatsappNumber() {
        return whatsappNumber;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public String getLocationUrl() {
        return locationUrl;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public ShopStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
