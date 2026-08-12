package com.smartqueue.application.port.out;

import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.model.ShopService;

import java.util.List;
import java.util.Optional;

public interface ShopServiceRepository {

    /** A shop's services, oldest first. */
    List<ShopService> findByShopId(String shopId);

    Optional<ShopService> findById(String id);

    boolean existsByShopIdAndService(String shopId, CatalogService service);

    ShopService save(ShopService service);

    void deleteById(String id);
}
