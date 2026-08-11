package com.smartqueue.domain;

/**
 * The kind of business a shop is. Smart Queue started with barbershops but the
 * queue model fits any "wait your turn" venue, so the type is stored per shop.
 *
 * <p>Mirrors the {@code chk_shops_type} CHECK in V2__shops_owner_and_profile.sql
 * and the frontend's shop-type options — these names are persisted as VARCHAR.
 */
public enum ShopType {
    SALON,
    RESTAURANT,
    HOSPITAL,
    CLINIC,
    GOVERNMENT,
    RETAIL,
    OTHER;

    /** The default when a caller does not specify a type. */
    public static final ShopType DEFAULT = SALON;
}
