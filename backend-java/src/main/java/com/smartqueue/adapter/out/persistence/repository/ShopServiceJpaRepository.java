package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.ShopServiceJpaEntity;
import com.smartqueue.domain.CatalogService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopServiceJpaRepository extends JpaRepository<ShopServiceJpaEntity, String> {

    List<ShopServiceJpaEntity> findByShopIdOrderByCreatedAtAsc(String shopId);

    boolean existsByShopIdAndService(String shopId, CatalogService service);
}
