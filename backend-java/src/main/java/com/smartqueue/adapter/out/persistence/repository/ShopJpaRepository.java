package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.ShopJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopJpaRepository extends JpaRepository<ShopJpaEntity, String> {

    List<ShopJpaEntity> findAllByOrderByCreatedAtAsc();

    List<ShopJpaEntity> findByOwnerIdOrderByCreatedAtAsc(String ownerId);

    long countByOwnerId(String ownerId);

    boolean existsByWhatsappNumber(String whatsappNumber);
}
