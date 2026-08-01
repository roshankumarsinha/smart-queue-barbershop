package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.result.QueueSnapshot;

public interface GetQueueStatusUseCase {

    QueueSnapshot snapshot(String shopId);
}
