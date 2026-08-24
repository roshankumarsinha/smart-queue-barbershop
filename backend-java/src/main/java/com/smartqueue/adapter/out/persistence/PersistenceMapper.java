package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.entity.NotificationJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.QueueEntryJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.ServiceCatalogJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.ShopJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.ShopServiceJpaEntity;
import com.smartqueue.adapter.out.persistence.entity.UserJpaEntity;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.model.Notification;
import com.smartqueue.domain.model.QueueEntry;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.ShopService;
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
                e.getOwnerId(),
                e.getName(),
                e.getType(),
                e.getWhatsappNumber(),
                e.getPhone(),
                e.getAddress(),
                e.getLocationUrl(),
                e.getStatus(),
                e.getOpeningTime(),
                e.getClosingTime(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    static ShopJpaEntity toEntity(Shop s) {
        return new ShopJpaEntity(
                idOrNew(s.id()),
                s.ownerId(),
                s.name(),
                s.type(),
                s.whatsappNumber(),
                s.phone(),
                s.address(),
                s.locationUrl(),
                s.openingTime(),
                s.closingTime(),
                s.status(),
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
                e.getShopId(),
                e.isActive(),
                e.isOnDuty());
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
                u.shopId(),
                u.active(),
                u.onDuty());
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
                e.getUpdatedAt(),
                e.getServedBy());
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
                q.updatedAt(),
                q.servedBy());
    }

    static CatalogService toDomain(ServiceCatalogJpaEntity e) {
        return new CatalogService(
                e.getCode(), e.getShopType(), e.getLabel(), e.getSortOrder(), e.isActive());
    }

    /** The catalog entry is looked up separately — see ShopServicePersistenceAdapter. */
    static ShopService toDomain(ShopServiceJpaEntity e, CatalogService service) {
        return new ShopService(
                e.getId(),
                e.getShopId(),
                service,
                e.getPrice(),
                e.getEstimatedMinutes(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    static ShopServiceJpaEntity toEntity(ShopService s) {
        return new ShopServiceJpaEntity(
                idOrNew(s.id()),
                s.shopId(),
                s.service().code(),
                s.price(),
                s.estimatedMinutes(),
                s.createdAt(),
                s.updatedAt());
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
