package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.CatalogService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Add a service to a shop. Whether {@code estimatedMinutes}/{@code price} are required is
 * a per-shop-type rule enforced in the service layer, so it isn't @NotNull here.
 */
public record AddServiceRequest(
        @NotNull CatalogService service,
        @Min(value = 0, message = "Price cannot be negative") Integer price,
        @Min(value = 1, message = "Estimated time must be at least 1 minute") Integer estimatedMinutes) {
}
