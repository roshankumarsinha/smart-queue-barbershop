package com.smartqueue.adapter.out.websocket;

import com.smartqueue.adapter.in.web.dto.QueueStatusResponse;
import com.smartqueue.application.port.in.result.QueueSnapshot;
import com.smartqueue.application.port.out.QueueEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Broadcasts to /status/queue/{shopId}. Reuses the REST response DTO on purpose so a
 * pushed update is byte-for-byte the same JSON as a polled GET /queue/board.
 */
@Component
class StompQueueEventPublisher implements QueueEventPublisher {

    private static final String TOPIC_PREFIX = "/status/queue/";

    private final SimpMessagingTemplate messaging;

    StompQueueEventPublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @Override
    public void publishQueueUpdate(String shopId, QueueSnapshot snapshot) {
        messaging.convertAndSend(TOPIC_PREFIX + shopId, QueueStatusResponse.from(snapshot));
    }
}
