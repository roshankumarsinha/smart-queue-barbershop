package com.smartqueue.domain;

/**
 * A shop's lifecycle state. Only an OPEN shop takes customers; NEW and CLOSED are
 * hidden from GET /shops and reject new queue joins, but stay reachable by id.
 * Opening is automatic — a barber (or an unstaffed shop's own owner) logging in
 * during business hours flips NEW/CLOSED to OPEN, see
 * {@code ShopService#checkInForLogin}. There's no manual open action; closing
 * still is (see {@code ShopController#close}).
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
