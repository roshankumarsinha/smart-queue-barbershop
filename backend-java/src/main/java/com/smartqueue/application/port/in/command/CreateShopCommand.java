package com.smartqueue.application.port.in.command;

import com.smartqueue.domain.ShopType;

import java.time.LocalTime;

/**
 * Details for a new shop. {@code ownerId} is the SHOP_OWNER it belongs to. A null
 * {@code type} lets the domain fall back to its default; the free-text fields may be
 * null (blanks are normalised away in the domain).
 */
public record CreateShopCommand(
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
