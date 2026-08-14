package com.smartqueue.application.port.in.command;

import com.smartqueue.domain.ShopType;

import java.time.LocalTime;

/**
 * Partial update of a shop. Every field is optional: null means "leave as-is", so a
 * caller only sends what changed. {@code ownerId} reassigns the shop to a different
 * owner and is admin-only at the web layer.
 */
public record UpdateShopCommand(
        String ownerId,
        String name,
        ShopType type,
        String whatsappNumber,
        String phone,
        String address,
        String locationUrl,
        LocalTime openingTime,
        LocalTime closingTime) {
}
