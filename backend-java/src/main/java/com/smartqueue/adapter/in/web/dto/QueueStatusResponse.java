package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.QueueSnapshot;

import java.util.List;

public record QueueStatusResponse(
        String shopId,
        QueueEntryResponse serving,
        List<QueueEntryResponse> waiting,
        int totalWaiting,
        int avgServiceTime,
        int estimatedWaitMinutes) {

    public static QueueStatusResponse from(QueueSnapshot s) {
        return new QueueStatusResponse(
                s.shopId(),
                QueueEntryResponse.from(s.serving()),
                s.waiting().stream().map(QueueEntryResponse::from).toList(),
                s.totalWaiting(),
                s.avgServiceTime(),
                s.estimatedWaitMinutes());
    }
}
