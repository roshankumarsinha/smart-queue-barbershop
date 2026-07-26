package com.smartqueue.domain.exception;

/** The request clashes with something that already exists. Mapped to HTTP 409 by the web adapter. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
