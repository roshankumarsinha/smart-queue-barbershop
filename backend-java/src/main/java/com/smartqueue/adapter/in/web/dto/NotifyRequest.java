package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotifyRequest(
        @NotBlank String entryId,
        @NotNull(message = "Unknown notification type") NotificationType type,
        String message) {
}
