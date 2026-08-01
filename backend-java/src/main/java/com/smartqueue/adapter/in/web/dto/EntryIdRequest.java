package com.smartqueue.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record EntryIdRequest(@NotBlank String entryId) {
}
