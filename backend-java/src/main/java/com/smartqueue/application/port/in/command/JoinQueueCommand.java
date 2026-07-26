package com.smartqueue.application.port.in.command;

import com.smartqueue.domain.ServiceType;

/** Customer self-join and staff walk-in are the same command — only the caller differs. */
public record JoinQueueCommand(String shopId, ServiceType service, String phone, String name) {
}
