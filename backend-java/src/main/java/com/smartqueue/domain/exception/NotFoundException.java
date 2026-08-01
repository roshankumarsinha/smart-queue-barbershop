package com.smartqueue.domain.exception;

/** Something the caller referenced by id does not exist. Mapped to HTTP 404 by the web adapter. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
