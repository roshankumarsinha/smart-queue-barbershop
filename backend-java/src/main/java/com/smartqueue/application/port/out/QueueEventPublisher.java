package com.smartqueue.application.port.out;

import com.smartqueue.application.port.in.result.QueueSnapshot;

/** Pushes the fresh queue state to every client watching this shop. */
public interface QueueEventPublisher {

    void publishQueueUpdate(String shopId, QueueSnapshot snapshot);
}
