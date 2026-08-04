package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.QueueEntryStatus;

public record QueueEntryStatusResponse(QueueEntryResponse entry, int ahead, int estimatedWaitMinutes) {

    public static QueueEntryStatusResponse from(QueueEntryStatus s) {
        return new QueueEntryStatusResponse(
                QueueEntryResponse.from(s.entry()), s.ahead(), s.estimatedWaitMinutes());
    }
}
