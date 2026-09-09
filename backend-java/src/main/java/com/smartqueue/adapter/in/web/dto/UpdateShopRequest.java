package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.ShopType;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

/**
 * Partial update of a shop — send only the fields you want changed; anything omitted
 * keeps its current value. Setting {@code ownerId} reassigns the shop and requires
 * ADMIN. Status is not editable here: use the open/close endpoints.
 */
public record UpdateShopRequest(
        String ownerId,
        @Size(min = 2) String name,
        ShopType type,
        String whatsappNumber,
        String phone,
        String address,
        String locationUrl,
        LocalTime openingTime,
        LocalTime closingTime,
        @Positive Integer maxChairs) {
}
