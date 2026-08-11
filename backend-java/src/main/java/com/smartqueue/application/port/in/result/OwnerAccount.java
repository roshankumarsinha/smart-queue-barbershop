package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.User;

/**
 * A shop owner plus how many shops they run — the shape the admin owner-list needs
 * without leaking password hashes or re-querying shops in the web layer.
 */
public record OwnerAccount(User owner, long shopCount) {
}
