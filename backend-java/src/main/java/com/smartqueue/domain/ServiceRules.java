package com.smartqueue.domain;

/**
 * Which service fields are mandatory when adding a service, per {@link ShopType}.
 * This is the seam that lets each vertical have a different "add service" form —
 * SALON requires an estimated time and leaves price optional; a future RESTAURANT
 * or HOSPITAL type can branch here without touching the services flow.
 */
public record ServiceRules(boolean estimatedMinutesRequired, boolean priceRequired) {

    public static ServiceRules forType(ShopType type) {
        // For now every vertical follows the salon rule. Add cases as new types arrive.
        return switch (type) {
            case SALON, RESTAURANT, HOSPITAL, CLINIC, GOVERNMENT, RETAIL, OTHER ->
                new ServiceRules(true, false);
        };
    }
}
