package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.AddServiceRequest;
import com.smartqueue.adapter.in.web.dto.CatalogItemResponse;
import com.smartqueue.adapter.in.web.dto.ShopServiceResponse;
import com.smartqueue.adapter.in.web.dto.UpdateServiceRequest;
import com.smartqueue.adapter.in.web.security.AuthenticatedUser;
import com.smartqueue.application.port.in.ManageServicesUseCase;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.AddServiceCommand;
import com.smartqueue.application.port.in.command.UpdateServiceCommand;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.exception.ValidationException;
import com.smartqueue.domain.model.Shop;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The services a shop offers. Managed by SUPER_ADMIN or the shop's own owner — the
 * role guard proves the caller is one of those, {@link #requireCanManage} proves they
 * own <em>this</em> shop.
 */
@RestController
@RequestMapping("/shops/{shopId}/services")
@Tag(name = "Services", description = "Services a shop offers")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SHOP_OWNER')")
public class ShopServiceController {

    private final ManageShopsUseCase shops;
    private final ManageServicesUseCase services;

    public ShopServiceController(ManageShopsUseCase shops, ManageServicesUseCase services) {
        this.shops = shops;
        this.services = services;
    }

    @Operation(summary = "List a shop's services")
    @GetMapping
    public List<ShopServiceResponse> findAll(
            @PathVariable String shopId, @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(shopId, caller);
        return services.findByShop(shopId).stream().map(ShopServiceResponse::from).toList();
    }

    @Operation(summary = "List services this shop can still add", description = "The catalog for its type minus what it already offers.")
    @GetMapping("/available")
    public List<CatalogItemResponse> available(
            @PathVariable String shopId, @AuthenticationPrincipal AuthenticatedUser caller) {
        Shop shop = requireCanManage(shopId, caller);
        return services.availableFor(shop).stream().map(CatalogItemResponse::from).toList();
    }

    @Operation(summary = "Add a service to a shop")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShopServiceResponse add(
            @PathVariable String shopId,
            @Valid @RequestBody AddServiceRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller) {
        Shop shop = requireCanManage(shopId, caller);
        CatalogService service = CatalogService.parse(request.service())
                .orElseThrow(() -> new ValidationException("Unknown service '" + request.service() + "'"));
        return ShopServiceResponse.from(services.add(
                shop, new AddServiceCommand(service, request.price(), request.estimatedMinutes())));
    }

    @Operation(summary = "Update a service's price / estimated time")
    @PatchMapping("/{serviceId}")
    public ShopServiceResponse update(
            @PathVariable String shopId,
            @PathVariable String serviceId,
            @Valid @RequestBody UpdateServiceRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller) {
        Shop shop = requireCanManage(shopId, caller);
        return ShopServiceResponse.from(services.update(
                shop, serviceId, new UpdateServiceCommand(request.price(), request.estimatedMinutes())));
    }

    @Operation(summary = "Remove a service from a shop")
    @DeleteMapping("/{serviceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @PathVariable String shopId,
            @PathVariable String serviceId,
            @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(shopId, caller);
        services.remove(shopId, serviceId);
    }

    /** Loads the shop and proves the caller is the admin or this shop's owner. Returns it for reuse. */
    private Shop requireCanManage(String shopId, AuthenticatedUser caller) {
        Shop shop = shops.findById(shopId);
        if (caller.role() != Role.SUPER_ADMIN && !caller.userId().equals(shop.ownerId())) {
            throw new AccessDeniedException("Not this shop's owner");
        }
        return shop;
    }
}
