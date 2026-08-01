package com.smartqueue.domain.model;

import com.smartqueue.domain.AuthMethod;
import com.smartqueue.domain.Role;

/**
 * A staff or admin account. Only one credential pair is populated per user:
 * email+passwordHash for owners/admins, phone+pinHash for barbers.
 */
public record User(
        String id,
        Role role,
        String name,
        String email,
        String passwordHash,
        String phone,
        String pinHash,
        String shopId) {

    private boolean byEmail() {
        return role.authMethod().orElse(null) == AuthMethod.EMAIL;
    }

    /** The stored hash to compare a login secret against, given how this role signs in. */
    public String credentialHash() {
        return byEmail() ? passwordHash : pinHash;
    }

    /** What the frontend displays as "who am I": email for admins, phone for barbers. */
    public String identifier() {
        return byEmail() ? email : phone;
    }
}
