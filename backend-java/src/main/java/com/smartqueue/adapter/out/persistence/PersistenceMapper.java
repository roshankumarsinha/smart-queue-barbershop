package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.entity.NotificationJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.QueueEntryJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.ShopJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.UserJpaEntity;
import com.smartqueue.domain.model.Notification;
import com.smartqueue.domain.model.QueueEntry;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;

import java.util.UUID;

/**
 * Translates between the framework-free domain records and the JPA entities.
 * Ids are minted here — the domain never has to know how they are generated.
 */
final class PersistenceMapper {

    private PersistenceMapper() {
    }

    static String idOrNew(String id) {
        return id != null ? id : UUID.randomUUID().toString();
    }

    static Shop toDomain(ShopJpaEntity e) {
        return new Shop(
                e.getId(),
                e.getName(),
                e.getWhatsappNumber(),
                e.getAvgServiceTime(),
                e.isActive(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    static ShopJpaEntity toEntity(Shop s) {
        return new ShopJpaEntity(
                idOrNew(s.id()),
                s.name(),
                s.whatsappNumber(),
                s.avgServiceTime(),
                s.active(),
                s.createdAt(),
                s.updatedAt());
    }

    static User toDomain(UserJpaEntity e) {
        return new User(
                e.getId(),
                e.getRole(),
                e.getName(),
                e.getEmail(),
                e.getPasswordHash(),
                e.getPhone(),
                e.getPinHash(),
                e.getShopId());
    }

    static UserJpaEntity toEntity(User u) {
        return new UserJpaEntity(
                idOrNew(u.id()),
                u.role(),
                u.name(),
                u.email(),
                u.passwordHash(),
                u.phone(),
                u.pinHash(),
                u.shopId());
    }

    static QueueEntry toDomain(QueueEntryJpaEntity e) {
        return new QueueEntry(
                e.getId(),
                e.getShopId(),
                e.getToken(),
                e.getCustomerName(),
                e.getPhone(),
                e.getService(),
                e.getStatus(),
                e.getPosition(),
                e.getJoinedAt(),
                e.getUpdatedAt());
    }

    static QueueEntryJpaEntity toEntity(QueueEntry q) {
        return new QueueEntryJpaEntity(
                idOrNew(q.id()),
                q.shopId(),
                q.token(),
                q.customerName(),
                q.phone(),
                q.service(),
                q.status(),
                q.position(),
                q.joinedAt(),
                q.updatedAt());
    }

    static Notification toDomain(NotificationJpaEntity e) {
        return new Notification(
                e.getId(), e.getQueueEntryId(), e.getType(), e.getChannel(), e.getSentAt());
    }

    static NotificationJpaEntity toEntity(Notification n) {
        return new NotificationJpaEntity(
                idOrNew(n.id()), n.queueEntryId(), n.type(), n.channel(), n.sentAt());
    }
}
