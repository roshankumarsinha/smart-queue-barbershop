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
        String shopId,
        boolean active) {

    /** A new account, active by default. */
    public User(
            String id,
            Role role,
            String name,
            String email,
            String passwordHash,
            String phone,
            String pinHash,
            String shopId) {
        this(id, role, name, email, passwordHash, phone, pinHash, shopId, true);
    }

    public User deactivated() {
        return withActive(false);
    }

    public User activated() {
        return withActive(true);
    }

    private User withActive(boolean newActive) {
        return new User(id, role, name, email, passwordHash, phone, pinHash, shopId, newActive);
    }

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
