package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateShopRequest(
        @NotBlank @Size(min = 2) String name,
        String whatsappNumber,
        String address,
        @Min(1) Integer avgServiceTime) {
}
