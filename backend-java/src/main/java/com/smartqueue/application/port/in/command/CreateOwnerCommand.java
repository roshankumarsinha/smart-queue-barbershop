package com.smartqueue.application.port.in.command;

/**
 * Admin-supplied details for a new shop owner. {@code password} is the plaintext
 * the admin typed — the service hashes it before it ever touches the database.
 * {@code phone} is optional contact info (owners sign in with email, not phone).
 */
public record CreateOwnerCommand(String name, String email, String phone, String password) {
}
