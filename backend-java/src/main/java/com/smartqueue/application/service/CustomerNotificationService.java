package com.smartqueue.application.service;

import com.smartqueue.application.port.out.NotificationRepository;
import com.smartqueue.application.port.out.NotificationSender;
import com.smartqueue.domain.NotificationType;
import com.smartqueue.domain.model.Notification;
import com.smartqueue.domain.model.QueueEntry;
import org.springframework.stereotype.Service;

/**
 * Sends a customer message and records that we sent it. Every notification in the
 * system goes through here so the audit trail can't be bypassed.
 */
@Service
public class CustomerNotificationService {

    private final NotificationSender sender;
    private final NotificationRepository notifications;

    public CustomerNotificationService(NotificationSender sender, NotificationRepository notifications) {
        this.sender = sender;
        this.notifications = notifications;
    }

    public void notify(QueueEntry entry, NotificationType type, String message) {
        sender.send(entry.phone(), type, message);
        notifications.save(Notification.sent(entry.id(), type));
    }
}
