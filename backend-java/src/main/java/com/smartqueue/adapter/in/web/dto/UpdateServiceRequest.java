package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.Min;

/** Update a shop service's price / estimated time. Per-type rules apply (see service layer). */
public record UpdateServiceRequest(
        @Min(value = 0, message = "Price cannot be negative") Integer price,
        @Min(value = 1, message = "Estimated time must be at least 1 minute") Integer estimatedMinutes) {
}
