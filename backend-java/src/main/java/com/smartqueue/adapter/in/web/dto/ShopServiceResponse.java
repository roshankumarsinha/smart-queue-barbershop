package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.model.ShopService;

import java.time.Instant;

/** A service a shop offers. {@code service} is the catalog code, {@code label} its display name. */
public record ShopServiceResponse(
        String id,
        String shopId,
        String service,
        String label,
        Integer price,
        int estimatedMinutes,
        Instant createdAt,
        Instant updatedAt) {

    public static ShopServiceResponse from(ShopService s) {
        return new ShopServiceResponse(
                s.id(),
                s.shopId(),
                s.service().name(),
                s.service().label(),
                s.price(),
                s.estimatedMinutes(),
                s.createdAt(),
                s.updatedAt());
    }
}
