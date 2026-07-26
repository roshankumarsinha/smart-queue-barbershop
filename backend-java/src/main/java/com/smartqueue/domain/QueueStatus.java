package com.smartqueue.domain;

import java.util.Set;

public enum QueueStatus {
    WAITING,
    IN_SERVICE,
    DONE,
    SKIPPED,
    NO_SHOW,
    LEFT;

    /** Statuses that still occupy a slot in the shop's ordering. */
    public static final Set<QueueStatus> ACTIVE = Set.of(WAITING, IN_SERVICE);
}
