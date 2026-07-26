package com.smartqueue.application.port.out;

import com.smartqueue.domain.model.Shop;

import java.util.List;
import java.util.Optional;

public interface ShopRepository {

    Optional<Shop> findById(String shopId);

    List<Shop> findAllByCreatedAt();

    boolean existsByWhatsappNumber(String whatsappNumber);

    Shop save(Shop shop);
}
