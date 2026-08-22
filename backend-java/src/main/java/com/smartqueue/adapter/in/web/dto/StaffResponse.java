package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.model.User;

/** A barber as the shop-detail screen sees it. Never carries the PIN hash. */
public record StaffResponse(String id, String shopId, String name, String phone, boolean active) {

    public static StaffResponse from(User u) {
        return new StaffResponse(u.id(), u.shopId(), u.name(), u.phone(), u.active());
    }
}
