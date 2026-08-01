package com.smartqueue.application.port.in.result;

import com.smartqueue.domain.model.QueueEntry;

/**
 * @param served     who was just finished, or null if the chair was empty
 * @param nowServing who was just promoted, or null if nobody was waiting
 */
public record AdvanceQueueResult(QueueEntry served, QueueEntry nowServing) {
}
