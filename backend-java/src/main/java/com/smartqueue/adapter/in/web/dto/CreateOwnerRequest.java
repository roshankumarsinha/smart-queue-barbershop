package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Admin-facing "register a shop owner" payload. Owners sign in with email +
 * password; {@code phone} is optional contact info.
 */
public record CreateOwnerRequest(
        @NotBlank @Size(min = 2) String name,
        @NotBlank @Email String email,
        String phone,
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password) {
}
