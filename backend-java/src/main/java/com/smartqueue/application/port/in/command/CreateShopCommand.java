package com.smartqueue.application.port.in.command;

/** {@code avgServiceTime} may be null — the domain falls back to its default. */
public record CreateShopCommand(String name, String whatsappNumber, String address, Integer avgServiceTime) {
}
