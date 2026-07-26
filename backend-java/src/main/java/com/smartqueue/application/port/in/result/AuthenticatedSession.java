package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.User;

public record AuthenticatedSession(User user, String token) {
}
