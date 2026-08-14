package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.ServiceCatalogJpaEntity;
import com.smartqueue.domain.ShopType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceCatalogJpaRepository extends JpaRepository<ServiceCatalogJpaEntity, String> {

    List<ServiceCatalogJpaEntity> findByShopTypeAndActiveTrueOrderBySortOrderAsc(ShopType shopType);
}
