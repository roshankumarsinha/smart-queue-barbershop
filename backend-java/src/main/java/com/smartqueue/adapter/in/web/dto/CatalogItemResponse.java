package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.CatalogService;

/** One selectable service in a shop type's catalog — the "add service" dropdown options. */
public record CatalogItemResponse(String code, String label) {

    public static CatalogItemResponse from(CatalogService s) {
        return new CatalogItemResponse(s.code(), s.label());
    }
}
