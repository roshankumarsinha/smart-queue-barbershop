package com.smartqueue.application.port.in.command;

/**
 * Add a service to a shop. {@code serviceCode} is a {@code service_catalog.code} —
 * resolved and checked against the shop's type in the service, since the catalog is
 * data and cannot be validated at compile time. {@code estimatedMinutes} may be null
 * at this layer (the per-shop-type rule is enforced in the service); {@code price} is
 * optional (INR, whole rupees).
 */
public record AddServiceCommand(String serviceCode, Integer price, Integer estimatedMinutes) {
}
