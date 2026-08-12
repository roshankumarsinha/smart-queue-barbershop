package com.smartqueue.application.port.in.command;

/** Update a shop service's mutable fields. Same per-type rules as adding apply. */
public record UpdateServiceCommand(Integer price, Integer estimatedMinutes) {
}
