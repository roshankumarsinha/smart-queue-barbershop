package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.ShopServiceJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopServiceJpaRepository extends JpaRepository<ShopServiceJpaEntity, String> {

    List<ShopServiceJpaEntity> findByShopIdOrderByCreatedAtAsc(String shopId);

    boolean existsByShopIdAndServiceCode(String shopId, String serviceCode);
}
