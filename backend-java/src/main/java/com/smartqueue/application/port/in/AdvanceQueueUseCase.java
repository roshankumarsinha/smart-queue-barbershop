package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.result.AdvanceQueueResult;

public interface AdvanceQueueUseCase {

    /** Finish whoever is in the chair and promote the next customer waiting. */
    AdvanceQueueResult advance(String shopId);
}
