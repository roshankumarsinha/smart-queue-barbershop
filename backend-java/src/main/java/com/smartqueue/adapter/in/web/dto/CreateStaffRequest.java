package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Register a barber under a shop. {@code phone} + {@code pin} are exactly what the
 * barber later signs in with (see {@code AuthService}), so both are constrained to
 * the same shape the login form already enforces client-side: a bare 10-digit phone
 * (no country code) and a 4-digit PIN.
 */
public record CreateStaffRequest(
        @NotBlank @Size(min = 2) String name,
        @NotBlank @Pattern(regexp = "\\d{10}", message = "Enter a 10-digit phone number") String phone,
        @NotBlank @Pattern(regexp = "\\d{4}", message = "PIN must be 4 digits") String pin) {
}
