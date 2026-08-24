package com.smartqueue.adapter.in.web.dto;

import com.smartqueue.application.port.in.result.QueueSnapshot;

import java.util.List;

public record QueueStatusResponse(
        String shopId,
        List<QueueEntryResponse> serving,
        List<QueueEntryResponse> waiting,
        int totalWaiting,
        int onDutyStaffCount,
        int estimatedWaitMinutes) {

    public static QueueStatusResponse from(QueueSnapshot s) {
        return new QueueStatusResponse(
                s.shopId(),
                s.serving().stream().map(QueueEntryResponse::from).toList(),
                s.waiting().stream().map(QueueEntryResponse::from).toList(),
                s.totalWaiting(),
                s.onDutyStaffCount(),
                s.estimatedWaitMinutes());
    }
}
