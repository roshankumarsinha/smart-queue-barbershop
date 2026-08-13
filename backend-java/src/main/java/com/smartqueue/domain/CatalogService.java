package com.smartqueue.domain;

/**
 * One selectable service in a shop type's catalog, e.g. {@code HAIRCUT} / "Haircut"
 * for a SALON. Each entry belongs to exactly one {@link ShopType}, so a shop can only
 * offer services from its own vertical's catalog.
 *
 * <p>This is data, not an enum: the catalog lives in the {@code service_catalog}
 * table so a new service can be added without a deploy. {@code code} is what
 * {@code shop_services.service_code} stores and what the API accepts.
 */
public record CatalogService(String code, ShopType shopType, String label, int sortOrder, boolean active) {
}
