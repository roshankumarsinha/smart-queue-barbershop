package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageServicesUseCase;
import com.smartqueue.application.port.in.command.AddServiceCommand;
import com.smartqueue.application.port.in.command.UpdateServiceCommand;
import com.smartqueue.application.port.out.ShopServiceRepository;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.ServiceRules;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.exception.ValidationException;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.ShopService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ShopServiceService implements ManageServicesUseCase {

    private final ShopServiceRepository services;

    public ShopServiceService(ShopServiceRepository services) {
        this.services = services;
    }

    @Override
    public List<ShopService> findByShop(String shopId) {
        return services.findByShopId(shopId);
    }

    @Override
    public List<CatalogService> availableFor(Shop shop) {
        Set<CatalogService> taken = services.findByShopId(shop.id()).stream()
                .map(ShopService::service)
                .collect(Collectors.toSet());
        return CatalogService.forType(shop.type()).stream()
                .filter(item -> !taken.contains(item))
                .toList();
    }

    @Override
    @Transactional
    public ShopService add(Shop shop, AddServiceCommand command) {
        requireOfferedByType(shop, command.service());
        int estimatedMinutes = validatedFields(shop, command.price(), command.estimatedMinutes());

        if (services.existsByShopIdAndService(shop.id(), command.service())) {
            throw new ConflictException("This shop already offers " + command.service().label());
        }
        return services.save(
                ShopService.adding(shop.id(), command.service(), command.price(), estimatedMinutes));
    }

    @Override
    @Transactional
    public ShopService update(Shop shop, String serviceId, UpdateServiceCommand command) {
        ShopService existing = requireServiceOfShop(shop.id(), serviceId);
        int estimatedMinutes = validatedFields(shop, command.price(), command.estimatedMinutes());
        return services.save(existing.withDetails(command.price(), estimatedMinutes));
    }

    @Override
    @Transactional
    public void remove(String shopId, String serviceId) {
        ShopService existing = requireServiceOfShop(shopId, serviceId);
        services.deleteById(existing.id());
    }

    /** The chosen service must belong to this shop's type (a restaurant can't add a haircut). */
    private static void requireOfferedByType(Shop shop, CatalogService service) {
        if (service == null || service.shopType() != shop.type()) {
            throw new ValidationException("That service isn't offered by a "
                    + shop.type().name().toLowerCase() + " shop");
        }
    }

    /** Applies the shop type's mandatory-field rules and returns the validated estimated time. */
    private static int validatedFields(Shop shop, Integer price, Integer estimatedMinutes) {
        ServiceRules rules = ServiceRules.forType(shop.type());
        if (rules.estimatedMinutesRequired() && estimatedMinutes == null) {
            throw new ValidationException("Estimated time is required");
        }
        if (estimatedMinutes != null && estimatedMinutes < 1) {
            throw new ValidationException("Estimated time must be at least 1 minute");
        }
        if (rules.priceRequired() && price == null) {
            throw new ValidationException("Price is required");
        }
        if (price != null && price < 0) {
            throw new ValidationException("Price cannot be negative");
        }
        return estimatedMinutes != null ? estimatedMinutes : 0;
    }

    /** Loads a service and proves it belongs to the given shop (404s otherwise, no leak). */
    private ShopService requireServiceOfShop(String shopId, String serviceId) {
        ShopService service = services.findById(serviceId)
                .filter(s -> s.shopId().equals(shopId))
                .orElseThrow(() -> new NotFoundException("Service not found"));
        return service;
    }
}
