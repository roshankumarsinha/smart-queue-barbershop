package com.smartqueue.domain.model;

import com.smartqueue.domain.CatalogService;

import java.time.Instant;

/**
 * One service a shop offers. {@code estimatedMinutes} is how long it takes (drives
 * queue wait estimates); {@code price} is optional (INR, whole rupees). The
 * {@link CatalogService} it references is constrained to the shop's type.
 */
public record ShopService(
        String id,
        String shopId,
        CatalogService service,
        Integer price,
        int estimatedMinutes,
        Instant createdAt,
        Instant updatedAt) {

    /** A not-yet-persisted service; the persistence adapter assigns id/timestamps. */
    public static ShopService adding(
            String shopId, CatalogService service, Integer price, int estimatedMinutes) {
        return new ShopService(null, shopId, service, price, estimatedMinutes, null, null);
    }

    /** A copy with updated mutable fields (price / estimated time). */
    public ShopService withDetails(Integer newPrice, int newEstimatedMinutes) {
        return new ShopService(id, shopId, service, newPrice, newEstimatedMinutes, createdAt, updatedAt);
    }
}
