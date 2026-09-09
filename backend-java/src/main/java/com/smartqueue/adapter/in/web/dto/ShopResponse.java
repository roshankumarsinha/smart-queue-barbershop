package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.ShopType;
import com.smartqueue.domain.model.Shop;

import java.time.Instant;
import java.time.LocalTime;

public record ShopResponse(
        String id,
        String ownerId,
        String name,
        ShopType type,
        String whatsappNumber,
        String phone,
        String address,
        String locationUrl,
        ShopStatus status,
        LocalTime openingTime,
        LocalTime closingTime,
        int maxChairs,
        Instant createdAt,
        Instant updatedAt,
        int onDutyStaffCount) {

    public static ShopResponse from(Shop s, int onDutyStaffCount) {
        return new ShopResponse(
                s.id(),
                s.ownerId(),
                s.name(),
                s.type(),
                s.whatsappNumber(),
                s.phone(),
                s.address(),
                s.locationUrl(),
                s.status(),
                s.openingTime(),
                s.closingTime(),
                s.maxChairs(),
                s.createdAt(),
                s.updatedAt(),
                onDutyStaffCount);
    }
}
