package com.smartqueue.adapter.out.persistence.entity;

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

/** Read-only in the app: the catalog is seeded and maintained as data. */
@Entity
@Table(name = "service_catalog")
public class ServiceCatalogJpaEntity {

    @Id
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "shop_type", nullable = false, length = 32)
    private ShopType shopType;

    @Column(nullable = false)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ServiceCatalogJpaEntity() {
        // for JPA
    }

    public String getCode() {
        return code;
    }

    public ShopType getShopType() {
        return shopType;
    }

    public String getLabel() {
        return label;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public boolean isActive() {
        return active;
    }
}
