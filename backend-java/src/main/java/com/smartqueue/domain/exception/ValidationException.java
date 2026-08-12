package com.smartqueue.domain.exception;

/**
 * A business rule was violated in a way the caller can fix — surfaced as HTTP 400.
 * Distinct from bean-validation on DTOs (which the framework raises); this is for
 * cross-field / domain rules such as "that service isn't offered by this shop type".
 */
public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
