package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.OwnerAccount;
import com.smartqueue.domain.model.User;

/**
 * A shop owner as the admin dashboard sees it. Never carries the password hash;
 * {@code shopCount} drives the "N shops" badge in the owner list.
 */
public record OwnerResponse(String id, String name, String email, String phone, long shopCount) {

    public static OwnerResponse from(OwnerAccount account) {
        User o = account.owner();
        return new OwnerResponse(o.id(), o.name(), o.email(), o.phone(), account.shopCount());
    }
}
