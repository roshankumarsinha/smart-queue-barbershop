package com.smartqueue.domain.model;

import java.time.Instant;

/**
 * A barbershop tenant. {@code avgServiceTime} drives every wait estimate we quote,
 * so it lives on the shop rather than being hard-coded.
 */
public record Shop(
        String id,
        String name,
        String whatsappNumber,
        int avgServiceTime,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {

    public static final int DEFAULT_AVG_SERVICE_TIME = 20;

    /**
     * A not-yet-persisted shop; the persistence adapter assigns id/timestamps.
     *
     * <p>A blank WhatsApp number collapses to {@code null} — "not provided yet" is one
     * state, and only NULL is exempt from the uniqueness rule on the column.
     */
    public static Shop opening(String name, String whatsappNumber, Integer avgServiceTime) {
        return new Shop(
                null,
                name,
                whatsappNumber == null || whatsappNumber.isBlank() ? null : whatsappNumber.trim(),
                avgServiceTime != null ? avgServiceTime : DEFAULT_AVG_SERVICE_TIME,
                true,
                null,
                null);
    }

    public int estimatedWaitMinutes(int customersAhead) {
        return customersAhead * avgServiceTime;
    }
}
