package com.smartqueue.domain;

import java.util.Optional;
import java.util.Set;

/**
 * Mirrors the NestJS backend's src/common/constants.ts and the frontend's
 * src/config/roles.js — these names are stored in the database and travel in JWTs.
 */
public enum Role {
    SHOP_OWNER(AuthMethod.EMAIL),
    SUPER_ADMIN(AuthMethod.EMAIL),
    BARBER_STAFF(AuthMethod.PHONE),
    /** Customers never sign in; they join the queue via WhatsApp. */
    CUSTOMER(null);

    /** Roles allowed to operate the live queue dashboard. */
    public static final Set<Role> STAFF = Set.of(SHOP_OWNER, BARBER_STAFF);

    private final AuthMethod authMethod;

    Role(AuthMethod authMethod) {
        this.authMethod = authMethod;
    }

    /** Empty for roles that cannot sign in. */
    public Optional<AuthMethod> authMethod() {
        return Optional.ofNullable(authMethod);
    }

    public boolean canLogin() {
        return authMethod != null;
    }
}
