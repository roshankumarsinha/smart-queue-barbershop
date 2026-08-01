package com.smartqueue.domain;

/**
 * Whether a shop is currently taking customers. A CLOSED shop is hidden from
 * GET /shops and rejects new queue joins, but stays reachable by id for staff to
 * manage or reopen it.
 */
public enum ShopStatus {
    OPEN,
    CLOSED
}
