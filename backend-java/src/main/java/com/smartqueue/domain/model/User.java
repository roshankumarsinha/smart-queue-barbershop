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
        boolean active,
        boolean onDuty) {

    /** A new account, active by default, off duty by default. */
    public User(
            String id,
            Role role,
            String name,
            String email,
            String passwordHash,
            String phone,
            String pinHash,
            String shopId) {
        this(id, role, name, email, passwordHash, phone, pinHash, shopId, true, false);
    }

    public User deactivated() {
        return withActive(false);
    }

    public User activated() {
        return withActive(true);
    }

    /** Meaningful only for {@link Role#BARBER_STAFF} — an on-duty barber is one concurrent chair. */
    public User onDutyOn() {
        return withOnDuty(true);
    }

    public User onDutyOff() {
        return withOnDuty(false);
    }

    private User withActive(boolean newActive) {
        return new User(id, role, name, email, passwordHash, phone, pinHash, shopId, newActive, onDuty);
    }

    private User withOnDuty(boolean newOnDuty) {
        return new User(id, role, name, email, passwordHash, phone, pinHash, shopId, active, newOnDuty);
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
