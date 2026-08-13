package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.entity.ShopServiceJpaEntity;
import com.smartqueue.adapter.out.persistence.repository.ServiceCatalogJpaRepository;
import com.smartqueue.adapter.out.persistence.repository.ShopServiceJpaRepository;
import com.smartqueue.application.port.out.ShopServiceRepository;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.model.ShopService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
class ShopServicePersistenceAdapter implements ShopServiceRepository {

    private final ShopServiceJpaRepository services;
    private final ServiceCatalogJpaRepository catalog;

    ShopServicePersistenceAdapter(ShopServiceJpaRepository services, ServiceCatalogJpaRepository catalog) {
        this.services = services;
        this.catalog = catalog;
    }

    /**
     * The catalog entries are fetched in one query rather than per row. A shop's codes
     * are distinct (uq_shop_services_shop_code), so Hibernate's first-level cache would
     * never collapse them — without the batch this is a query per service listed.
     */
    @Override
    public List<ShopService> findByShopId(String shopId) {
        List<ShopServiceJpaEntity> rows = services.findByShopIdOrderByCreatedAtAsc(shopId);
        if (rows.isEmpty()) {
            return List.of();
        }
        Set<String> codes = rows.stream()
                .map(ShopServiceJpaEntity::getServiceCode)
                .collect(Collectors.toSet());
        Map<String, CatalogService> byCode = catalog.findAllById(codes).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toMap(CatalogService::code, Function.identity()));

        return rows.stream()
                .map(row -> PersistenceMapper.toDomain(
                        row, requireCatalog(byCode.get(row.getServiceCode()), row.getServiceCode())))
                .toList();
    }

    @Override
    public Optional<ShopService> findById(String id) {
        return services.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsByShopIdAndService(String shopId, String serviceCode) {
        return services.existsByShopIdAndServiceCode(shopId, serviceCode);
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
            return toDomain(services.saveAndFlush(PersistenceMapper.toEntity(service)));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("This shop already offers " + service.service().label());
        }
    }

    @Override
    public void deleteById(String id) {
        services.deleteById(id);
    }

    /** Single-row lookup — used where exactly one service is in hand (findById, save). */
    private ShopService toDomain(ShopServiceJpaEntity entity) {
        CatalogService service = catalog.findById(entity.getServiceCode())
                .map(PersistenceMapper::toDomain)
                .orElse(null);
        return PersistenceMapper.toDomain(entity, requireCatalog(service, entity.getServiceCode()));
    }

    /**
     * A missing catalog row means the FK to service_catalog was bypassed, so this fails
     * loudly rather than silently rendering a service with no label.
     */
    private static CatalogService requireCatalog(CatalogService service, String code) {
        if (service == null) {
            throw new IllegalStateException("shop_services references unknown service_catalog code: " + code);
        }
        return service;
    }
}
