package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * {@code token} is optional — omit it to claim whoever's earliest in line (the default), or
 * set it to jump a specific waiting customer's token to the front, e.g. because someone with
 * a later token has actually arrived while an earlier one hasn't shown up yet.
 */
public record AdvanceQueueRequest(@NotBlank String shopId, Integer token) {
}
