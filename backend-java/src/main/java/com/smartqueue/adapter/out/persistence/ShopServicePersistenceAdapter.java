package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.repository.ShopServiceJpaRepository;
import com.smartqueue.application.port.out.ShopServiceRepository;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.model.ShopService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class ShopServicePersistenceAdapter implements ShopServiceRepository {

    private final ShopServiceJpaRepository services;

    ShopServicePersistenceAdapter(ShopServiceJpaRepository services) {
        this.services = services;
    }

    @Override
    public List<ShopService> findByShopId(String shopId) {
        return services.findByShopIdOrderByCreatedAtAsc(shopId).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<ShopService> findById(String id) {
        return services.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public boolean existsByShopIdAndService(String shopId, CatalogService service) {
        return services.existsByShopIdAndService(shopId, service);
    }

    /**
     * Flushed so the returned service carries its generated timestamps. The service
     * pre-checks for a duplicate; this catch is the backstop for two concurrent adds
     * that both pass that check, turning the uq_shop_services_shop_code violation into
     * a 409 rather than a 500.
     */
    @Override
    public ShopService save(ShopService service) {
        try {
            return PersistenceMapper.toDomain(services.saveAndFlush(PersistenceMapper.toEntity(service)));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("This shop already offers " + service.service().label());
        }
    }

    @Override
    public void deleteById(String id) {
        services.deleteById(id);
    }
}
