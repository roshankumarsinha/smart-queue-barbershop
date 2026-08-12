package com.smartqueue.domain;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * The catalog of services a shop can offer, scoped by {@link ShopType}. Each entry
 * belongs to exactly one shop type, so {@link #forType(ShopType)} yields that type's
 * menu — e.g. a SALON offers haircuts and facials, a (future) RESTAURANT would offer
 * its own set. New verticals plug in by adding entries with their {@code ShopType};
 * nothing else in the services layer needs to change.
 *
 * <p>Stored by {@code name()} in {@code shop_services.service_code}.
 */
public enum CatalogService {
    // --- SALON ---------------------------------------------------------------
    HAIRCUT(ShopType.SALON, "Haircut"),
    BEARD(ShopType.SALON, "Beard grooming"),
    SHAVE(ShopType.SALON, "Shave"),
    FACIAL(ShopType.SALON, "Facial"),
    DETAN(ShopType.SALON, "De-tan"),
    HAIR_COLOR(ShopType.SALON, "Hair colour"),
    HEAD_MASSAGE(ShopType.SALON, "Head massage"),
    HAIR_SPA(ShopType.SALON, "Hair spa"),
    HAIR_WASH(ShopType.SALON, "Hair wash"),
    KIDS_HAIRCUT(ShopType.SALON, "Kids haircut");

    private final ShopType shopType;
    private final String label;

    CatalogService(ShopType shopType, String label) {
        this.shopType = shopType;
        this.label = label;
    }

    public ShopType shopType() {
        return shopType;
    }

    /** Human-readable name for the dropdown / service card. */
    public String label() {
        return label;
    }

    /** Every service offered by a given shop type, in declaration order. */
    public static List<CatalogService> forType(ShopType type) {
        return Arrays.stream(values()).filter(s -> s.shopType == type).toList();
    }

    /** Empty when {@code code} is not a known service. */
    public static Optional<CatalogService> parse(String code) {
        if (code == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(code));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
