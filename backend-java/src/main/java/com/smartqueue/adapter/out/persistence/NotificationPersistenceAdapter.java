package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.repository.NotificationJpaRepository;
import com.smartqueue.application.port.out.NotificationRepository;
import com.smartqueue.domain.model.Notification;
import org.springframework.stereotype.Component;

@Component
class NotificationPersistenceAdapter implements NotificationRepository {

    private final NotificationJpaRepository notifications;

    NotificationPersistenceAdapter(NotificationJpaRepository notifications) {
        this.notifications = notifications;
    }

    @Override
    public Notification save(Notification notification) {
        return PersistenceMapper.toDomain(
                notifications.saveAndFlush(PersistenceMapper.toEntity(notification)));
    }
}
