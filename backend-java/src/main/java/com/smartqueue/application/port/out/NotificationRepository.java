package com.smartqueue.application.port.out;

import com.smartqueue.domain.model.Notification;

public interface NotificationRepository {

    Notification save(Notification notification);
}
