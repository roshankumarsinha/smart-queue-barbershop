package com.smartqueue.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartqueue.domain.AuthMethod;
import com.smartqueue.domain.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

/**
 * Matches the payload the frontend already sends (src/api/auth.js):
 * {@code { roleKey, email?, password?, phone?, pin? }}. Which credential pair is
 * required depends on the role, so the checks are conditional rather than field-level.
 */
public record LoginRequest(
        @NotBlank String roleKey,
        String email,
        String password,
        String phone,
        String pin,
        String shopId) {

    private static final int MIN_PASSWORD_LENGTH = 6;

    /** Null when roleKey is unknown — never throws, so validation can report it cleanly. */
    public Role role() {
        try {
            return Role.valueOf(roleKey);
        } catch (IllegalArgumentException | NullPointerException e) {
            return null;
        }
    }

    private AuthMethod method() {
        Role role = role();
        return role != null ? role.authMethod().orElse(null) : null;
    }

    // The three checks below are conditional validation rules, not input fields.
    // @JsonIgnore keeps them out of the OpenAPI request schema, where their
    // getter-shaped names would otherwise show up as properties to send.

    @JsonIgnore
    @AssertTrue(message = "Unknown or non-login role")
    public boolean isKnownLoginRole() {
        return method() != null;
    }

    @JsonIgnore
    @AssertTrue(message = "email and a password of at least 6 characters are required for this role")
    public boolean isEmailCredentialComplete() {
        if (method() != AuthMethod.EMAIL) {
            return true;
        }
        return email != null && !email.isBlank()
                && password != null && password.length() >= MIN_PASSWORD_LENGTH;
    }

    @JsonIgnore
    @AssertTrue(message = "phone and pin are required for this role")
    public boolean isPhoneCredentialComplete() {
        if (method() != AuthMethod.PHONE) {
            return true;
        }
        return phone != null && !phone.isBlank() && pin != null && !pin.isBlank();
    }
}
