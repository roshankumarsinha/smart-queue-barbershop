package com.smartqueue.adapter.in.web.security;

import com.smartqueue.domain.Role;

/**
 * The authenticated principal, resolved from the bearer token on every request.
 * Injected into handlers with {@code @AuthenticationPrincipal} — the Spring
 * equivalent of the NestJS {@code @CurrentUser()} decorator.
 */
public record AuthenticatedUser(String userId, Role role, String shopId) {
}
