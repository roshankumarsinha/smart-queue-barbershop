package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.repository.ShopJpaRepository;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.model.Shop;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class ShopPersistenceAdapter implements ShopRepository {

    private final ShopJpaRepository shops;

    ShopPersistenceAdapter(ShopJpaRepository shops) {
        this.shops = shops;
    }

    @Override
    public Optional<Shop> findById(String shopId) {
        return shops.findById(shopId).map(PersistenceMapper::toDomain);
    }

    @Override
    public List<Shop> findAllByCreatedAt() {
        return shops.findAllByOrderByCreatedAtAsc().stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public List<Shop> findByOwnerId(String ownerId) {
        return shops.findByOwnerIdOrderByCreatedAtAsc(ownerId).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public long countByOwnerId(String ownerId) {
        return shops.countByOwnerId(ownerId);
    }

    @Override
    public boolean existsByWhatsappNumber(String whatsappNumber) {
        return shops.existsByWhatsappNumber(whatsappNumber);
    }

    /**
     * Flushed so the returned shop carries its generated timestamps — see QueueEntryPersistenceAdapter.
     *
     * <p>ShopService checks for a duplicate WhatsApp number first; this catch is the backstop
     * for two concurrent creates that both pass that check, turning the resulting
     * uq_shops_whatsapp_number violation into a 409 rather than a 500.
     */
    @Override
    public Shop save(Shop shop) {
        try {
            return PersistenceMapper.toDomain(shops.saveAndFlush(PersistenceMapper.toEntity(shop)));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("A shop with this WhatsApp number already exists");
        }
    }
}
