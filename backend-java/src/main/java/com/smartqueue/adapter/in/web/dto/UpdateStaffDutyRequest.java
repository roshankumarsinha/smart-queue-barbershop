package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;

/** Mark a barber on/off duty — each on-duty barber is one concurrent chair. */
public record UpdateStaffDutyRequest(@NotNull Boolean onDuty) {
}
