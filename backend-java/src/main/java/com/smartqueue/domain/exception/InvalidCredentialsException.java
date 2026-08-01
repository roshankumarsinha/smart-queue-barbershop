package com.smartqueue.domain.exception;

/**
 * Login failed. Deliberately carries no detail about which field was wrong —
 * same reasoning as the NestJS AuthService's single generic message.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid credentials");
    }
}
