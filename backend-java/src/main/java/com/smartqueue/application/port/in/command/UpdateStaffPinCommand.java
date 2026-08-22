package com.smartqueue.application.port.in.command;

/**
 * Reset a barber's PIN. No old PIN is required — this is an admin/owner action on
 * someone else's account, not a self-service change, so there's nothing to verify
 * against (compare {@code CreateOwnerCommand}, which doesn't ask for a "current
 * password" either).
 */
public record UpdateStaffPinCommand(String pin) {
}
