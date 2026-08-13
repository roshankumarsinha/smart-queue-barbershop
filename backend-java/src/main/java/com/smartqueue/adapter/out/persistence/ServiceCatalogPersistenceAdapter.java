package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.repository.ServiceCatalogJpaRepository;
import com.smartqueue.application.port.out.ServiceCatalogRepository;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.ShopType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class ServiceCatalogPersistenceAdapter implements ServiceCatalogRepository {

    private final ServiceCatalogJpaRepository catalog;

    ServiceCatalogPersistenceAdapter(ServiceCatalogJpaRepository catalog) {
        this.catalog = catalog;
    }

    @Override
    public List<CatalogService> findByShopType(ShopType shopType) {
        return catalog.findByShopTypeAndActiveTrueOrderBySortOrderAsc(shopType).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<CatalogService> findByCode(String code) {
        return code == null ? Optional.empty() : catalog.findById(code).map(PersistenceMapper::toDomain);
    }
}
