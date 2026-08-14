package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Add a service to a shop. {@code service} is a {@code service_catalog.code} (e.g.
 * "HAIRCUT") — the catalog is data, so the code is validated against the table in the
 * service layer rather than by binding to an enum here. Whether
 * {@code estimatedMinutes}/{@code price} are required is a per-shop-type rule, also
 * enforced in the service layer.
 */
public record AddServiceRequest(
        @NotBlank String service,
        @Min(value = 0, message = "Price cannot be negative") Integer price,
        @Min(value = 1, message = "Estimated time must be at least 1 minute") Integer estimatedMinutes) {
}
