package com.smartqueue.application.port.out;

import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.ShopType;

import java.util.List;
import java.util.Optional;

/** Read access to the service catalog. Editing it is a data task, not an API yet. */
public interface ServiceCatalogRepository {

    /** Active services for a shop type, in display order. */
    List<CatalogService> findByShopType(ShopType shopType);

    /** Looks up any entry by code, including retired ones — existing shop_services rows still point at those. */
    Optional<CatalogService> findByCode(String code);
}
