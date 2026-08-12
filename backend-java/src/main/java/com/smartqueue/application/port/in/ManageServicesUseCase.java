package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.AddServiceCommand;
import com.smartqueue.application.port.in.command.UpdateServiceCommand;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.ShopService;

import java.util.List;

/**
 * Managing the services a shop offers. Callers (the web layer) authorize access to
 * the shop first and pass the loaded {@link Shop} in where the shop's type is needed.
 */
public interface ManageServicesUseCase {

    List<ShopService> findByShop(String shopId);

    /** Catalog for the shop's type minus what it already offers — the "add" dropdown. */
    List<CatalogService> availableFor(Shop shop);

    ShopService add(Shop shop, AddServiceCommand command);

    ShopService update(Shop shop, String serviceId, UpdateServiceCommand command);

    void remove(String shopId, String serviceId);
}
