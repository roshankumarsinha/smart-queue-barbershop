package com.smartqueue.application.port.out;

public interface PasswordHasher {

    String hash(String raw);

    /** @param hash may be null — a user with no credential for this method never matches. */
    boolean matches(String raw, String hash);
}
