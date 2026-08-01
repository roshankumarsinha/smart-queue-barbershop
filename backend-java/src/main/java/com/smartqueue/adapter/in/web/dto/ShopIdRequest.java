package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ShopIdRequest(@NotBlank String shopId) {
}
