package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.AuthenticatedSession;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.model.User;

/** The exact shape the frontend expects: {@code { user, role, token }}. */
public record LoginResponse(UserSummary user, Role role, String token) {

    /** {@code identifier} is the email for admins/owners, the phone for barbers. */
    public record UserSummary(String id, String name, String identifier, String shopId, boolean onDuty) {
    }

    public static LoginResponse from(AuthenticatedSession session) {
        User u = session.user();
        return new LoginResponse(
                new UserSummary(u.id(), u.name(), u.identifier(), u.shopId(), u.onDuty()),
                u.role(),
                session.token());
    }
}
