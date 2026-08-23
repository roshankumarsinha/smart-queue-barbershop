package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.result.AdvanceQueueResult;

public interface AdvanceQueueUseCase {

    /**
     * Finish whoever is in {@code staffId}'s chair and claim a customer into it.
     * {@code staffId} must be an on-duty barber of this shop. {@code requestedToken} is
     * optional — null claims whoever's earliest in line; set it to serve a specific waiting
     * customer out of turn (e.g. an earlier token hasn't arrived yet). Fails if that token
     * isn't currently WAITING.
     */
    AdvanceQueueResult advance(String shopId, String staffId, Integer requestedToken);
}
