package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.model.Shop;

public record ShopStatusResponse(String id, ShopStatus status) {

    public static ShopStatusResponse from(Shop s) {
        return new ShopStatusResponse(s.id(), s.status());
    }
}
