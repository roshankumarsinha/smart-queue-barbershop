package com.smartqueue.domain.model;

import com.smartqueue.domain.ShopStatus;

import java.time.Instant;

/**
 * A barbershop tenant. {@code avgServiceTime} drives every wait estimate we quote,
 * so it lives on the shop rather than being hard-coded.
 */
public record Shop(
        String id,
        String name,
        String whatsappNumber,
        String address,
        int avgServiceTime,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {

    public static final int DEFAULT_AVG_SERVICE_TIME = 20;

    /**
     * A not-yet-persisted shop; the persistence adapter assigns id/timestamps.
     *
     * <p>A blank WhatsApp number or address collapses to {@code null} — "not provided
     * yet" is one state, and only NULL is exempt from the uniqueness rule on the
     * WhatsApp number column.
     */
    public static Shop opening(String name, String whatsappNumber, String address, Integer avgServiceTime) {
        return new Shop(
                null,
                name,
                whatsappNumber == null || whatsappNumber.isBlank() ? null : whatsappNumber.trim(),
                address == null || address.isBlank() ? null : address.trim(),
                avgServiceTime != null ? avgServiceTime : DEFAULT_AVG_SERVICE_TIME,
                true,
                null,
                null);
    }

    public int estimatedWaitMinutes(int customersAhead) {
        return customersAhead * avgServiceTime;
    }

    public ShopStatus status() {
        return active ? ShopStatus.OPEN : ShopStatus.CLOSED;
    }

    public Shop closed() {
        return new Shop(id, name, whatsappNumber, address, avgServiceTime, false, createdAt, updatedAt);
    }

    public Shop opened() {
        return new Shop(id, name, whatsappNumber, address, avgServiceTime, true, createdAt, updatedAt);
    }
}
