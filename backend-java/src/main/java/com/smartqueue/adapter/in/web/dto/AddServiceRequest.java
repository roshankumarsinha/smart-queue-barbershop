package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Add a service to a shop. {@code service} is a {@link com.smartqueue.domain.CatalogService}
 * code (e.g. "HAIRCUT"). Whether {@code estimatedMinutes}/{@code price} are required is a
 * per-shop-type rule enforced in the service layer, so it isn't @NotNull here.
 */
public record AddServiceRequest(
        @NotBlank String service,
        @Min(value = 0, message = "Price cannot be negative") Integer price,
        @Min(value = 1, message = "Estimated time must be at least 1 minute") Integer estimatedMinutes) {
}
