package com.smartqueue.domain.model;

import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.ShopType;

import java.time.Instant;
import java.time.LocalTime;

/**
 * A venue tenant (barbershop, clinic, restaurant, …). {@code ownerId} is the
 * {@link User} that owns it — one owner can hold many shops. A shop moves through
 * {@link ShopStatus}: it is {@code NEW} when first registered and only takes
 * customers once {@code OPEN}.
 */
public record Shop(
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
        Instant createdAt,
        Instant updatedAt) {

    /**
     * Fallback per-customer service time (minutes) used for wait estimates until the
     * planned per-service times exist. Every "~N min" figure is derived from this.
     */
    public static final int DEFAULT_SERVICE_MINUTES = 20;

    /**
     * A not-yet-persisted shop; the persistence adapter assigns id/timestamps. A
     * freshly registered shop starts {@link ShopStatus#NEW} — an owner opens it later.
     *
     * <p>Blank free-text fields collapse to {@code null} — "not provided yet" is one
     * state, and only NULL is exempt from the uniqueness rule on the WhatsApp number
     * column. A null {@code type} falls back to its default.
     */
    public static Shop opening(
            String ownerId,
            String name,
            ShopType type,
            String whatsappNumber,
            String phone,
            String address,
            String locationUrl,
            LocalTime openingTime,
            LocalTime closingTime) {
        return new Shop(
                null,
                ownerId,
                name,
                type != null ? type : ShopType.DEFAULT,
                blankToNull(whatsappNumber),
                blankToNull(phone),
                blankToNull(address),
                blankToNull(locationUrl),
                ShopStatus.NEW,
                openingTime,
                closingTime,
                null,
                null);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * A chair currently occupied counts as half a customer, not a full one or zero — the
     * person in it is, on average, about halfway through their service, so it still delays
     * the next arrival but by less than someone who hasn't been seen yet.
     * {@code totalChairs} floors at 1 so a temporarily-unstaffed queue still gets a sane estimate.
     */
    public int estimatedWaitMinutes(int waitingAhead, int occupiedChairs, int totalChairs) {
        int chairs = Math.max(totalChairs, 1);
        double weightedAhead = waitingAhead + 0.5 * occupiedChairs;
        return (int) Math.ceil(weightedAhead / chairs) * DEFAULT_SERVICE_MINUTES;
    }

    /** A shop takes customers only while OPEN — NEW and CLOSED both reject joins. */
    public boolean active() {
        return status == ShopStatus.OPEN;
    }

    public Shop opened() {
        return withStatus(ShopStatus.OPEN);
    }

    public Shop closed() {
        return withStatus(ShopStatus.CLOSED);
    }

    /**
     * A copy with edited profile fields. Every argument is "the new value", already
     * merged by the caller — a null here clears the field rather than leaving it alone,
     * so partial-update semantics belong in the service, not here. {@code status},
     * timestamps and id are never editable this way.
     */
    public Shop withProfile(
            String newOwnerId,
            String newName,
            ShopType newType,
            String newWhatsappNumber,
            String newPhone,
            String newAddress,
            String newLocationUrl,
            LocalTime newOpeningTime,
            LocalTime newClosingTime) {
        return new Shop(
                id,
                newOwnerId,
                newName,
                newType,
                blankToNull(newWhatsappNumber),
                blankToNull(newPhone),
                blankToNull(newAddress),
                blankToNull(newLocationUrl),
                status,
                newOpeningTime,
                newClosingTime,
                createdAt,
                updatedAt);
    }

    private Shop withStatus(ShopStatus newStatus) {
        return new Shop(
                id, ownerId, name, type, whatsappNumber, phone, address, locationUrl,
                newStatus, openingTime, closingTime, createdAt, updatedAt);
    }
}
