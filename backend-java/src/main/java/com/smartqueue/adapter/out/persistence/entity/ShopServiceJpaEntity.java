package com.smartqueue.adapter.out.persistence.entity;

import com.smartqueue.domain.CatalogService;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "shop_services")
public class ShopServiceJpaEntity {

    @Id
    private String id;

    @Column(name = "shop_id", nullable = false)
    private String shopId;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_code", nullable = false, length = 64)
    private CatalogService service;

    @Column
    private Integer price;

    @Column(name = "estimated_minutes", nullable = false)
    private int estimatedMinutes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ShopServiceJpaEntity() {
        // for JPA
    }

    public ShopServiceJpaEntity(
            String id,
            String shopId,
            CatalogService service,
            Integer price,
            int estimatedMinutes,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.shopId = shopId;
        this.service = service;
        this.price = price;
        this.estimatedMinutes = estimatedMinutes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getShopId() {
        return shopId;
    }

    public CatalogService getService() {
        return service;
    }

    public Integer getPrice() {
        return price;
    }

    public int getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
