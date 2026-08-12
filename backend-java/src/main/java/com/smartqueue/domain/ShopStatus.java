package com.smartqueue.domain;

/**
 * A shop's lifecycle state. Only an OPEN shop takes customers; NEW and CLOSED are
 * hidden from GET /shops and reject new queue joins, but stay reachable by id for
 * staff to open or reopen.
 *
 * <ul>
 *   <li>{@code NEW} — just registered, not yet opened for customers.</li>
 *   <li>{@code OPEN} — taking customers.</li>
 *   <li>{@code CLOSED} — was open, now closed.</li>
 * </ul>
 */
public enum ShopStatus {
    NEW,
    OPEN,
    CLOSED
}
