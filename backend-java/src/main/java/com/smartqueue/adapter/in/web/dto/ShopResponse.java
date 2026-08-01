package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.model.Shop;

import java.time.Instant;

public record ShopResponse(
        String id,
        String name,
        String whatsappNumber,
        int avgServiceTime,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {

    public static ShopResponse from(Shop s) {
        return new ShopResponse(
                s.id(),
                s.name(),
                s.whatsappNumber(),
                s.avgServiceTime(),
                s.active(),
                s.createdAt(),
                s.updatedAt());
    }
}
