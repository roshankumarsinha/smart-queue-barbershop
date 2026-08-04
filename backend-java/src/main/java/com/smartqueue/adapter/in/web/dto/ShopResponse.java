package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.model.Shop;

import java.time.Instant;

public record ShopResponse(
        String id,
        String name,
        String whatsappNumber,
        String address,
        int avgServiceTime,
        ShopStatus status,
        Instant createdAt,
        Instant updatedAt) {

    public static ShopResponse from(Shop s) {
        return new ShopResponse(
                s.id(),
                s.name(),
                s.whatsappNumber(),
                s.address(),
                s.avgServiceTime(),
                s.status(),
                s.createdAt(),
                s.updatedAt());
    }
}
