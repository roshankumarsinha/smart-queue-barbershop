package com.smartqueue.application.port.in.command;

import com.smartqueue.domain.CatalogService;

/**
 * Add a service to a shop. {@code estimatedMinutes} may be null at this layer — the
 * per-shop-type rule (SALON requires it) is enforced in the service, so other types
 * can differ. {@code price} is optional (INR, whole rupees).
 */
public record AddServiceCommand(CatalogService service, Integer price, Integer estimatedMinutes) {
}
