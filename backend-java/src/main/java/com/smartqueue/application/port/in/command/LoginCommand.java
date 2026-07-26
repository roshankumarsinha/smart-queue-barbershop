package com.smartqueue.application.port.in.command;

import com.smartqueue.domain.Role;

/**
 * Only the pair matching {@code role.authMethod()} is populated; the web adapter
 * enforces that before this ever reaches the application layer.
 */
public record LoginCommand(Role role, String email, String password, String phone, String pin) {
}
