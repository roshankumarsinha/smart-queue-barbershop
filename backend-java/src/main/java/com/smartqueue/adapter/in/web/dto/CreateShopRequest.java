package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.ShopType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

/**
 * "Register a shop under this owner" payload. The owner comes from the URL, not
 * the body. Times are "HH:mm". 
 */
public record CreateShopRequest(
        @NotBlank @Size(min = 2) String name,
        @NotNull ShopType type,
        String whatsappNumber,
        String phone,
        String address,
        String locationUrl,
        LocalTime openingTime,
        LocalTime closingTime,
        @NotNull @Positive Integer maxChairs) {
}
