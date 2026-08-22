package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Reset a barber's PIN. Same 4-digit shape as registration — no old PIN needed. */
public record UpdateStaffPinRequest(
        @NotBlank @Pattern(regexp = "\\d{4}", message = "PIN must be 4 digits") String pin) {
}
