package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record JoinQueueRequest(
        @NotBlank String shopId,
        @NotNull(message = "Unknown service") ServiceType service,
        String phone,
        String name) {
}
