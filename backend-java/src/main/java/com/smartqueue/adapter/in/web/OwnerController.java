package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.CreateOwnerRequest;
import com.smartqueue.adapter.in.web.dto.CreateShopRequest;
import com.smartqueue.adapter.in.web.dto.OwnerResponse;
import com.smartqueue.adapter.in.web.dto.ShopResponse;
import com.smartqueue.application.port.in.ManageOwnersUseCase;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.CreateOwnerCommand;
import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.domain.model.Shop;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Shop-owner onboarding. Every route here is ADMIN-only (see SecurityConfig + @PreAuthorize). */
@RestController
@RequestMapping("/owners")
@Tag(name = "Owners", description = "Shop owner accounts (admin only)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class OwnerController {

    private final ManageOwnersUseCase owners;
    private final ManageShopsUseCase shops;

    public OwnerController(ManageOwnersUseCase owners, ManageShopsUseCase shops) {
        this.owners = owners;
        this.shops = shops;
    }

    @Operation(summary = "List shop owners", description = "Each owner carries its current shop count.")
    @GetMapping
    public List<OwnerResponse> findAll() {
        return owners.findAll().stream().map(OwnerResponse::from).toList();
    }

    @Operation(summary = "Fetch one owner")
    @GetMapping("/{id}")
    public OwnerResponse findOne(@PathVariable String id) {
        return OwnerResponse.from(owners.findById(id));
    }

    @Operation(summary = "Register a shop owner", description = "Requires the ADMIN role.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OwnerResponse create(@Valid @RequestBody CreateOwnerRequest request) {
        return OwnerResponse.from(owners.createOwner(new CreateOwnerCommand(
                request.name(), request.email(), request.phone(), request.password())));
    }

    @Operation(
            summary = "Deactivate a shop owner",
            description = "Blocks sign-in and closes all their shops. Nothing is deleted — history is kept.")
    @PostMapping("/{id}/deactivate")
    public OwnerResponse deactivate(@PathVariable String id) {
        return OwnerResponse.from(owners.deactivate(id));
    }

    @Operation(
            summary = "Reactivate a shop owner",
            description = "Restores sign-in. Their shops stay closed until reopened individually.")
    @PostMapping("/{id}/activate")
    public OwnerResponse activate(@PathVariable String id) {
        return OwnerResponse.from(owners.activate(id));
    }

    // --- Shops under an owner (the admin drill-down) -------------------------------

    @Operation(summary = "List an owner's shops", description = "Open and closed alike, oldest first.")
    @GetMapping("/{id}/shops")
    public List<ShopResponse> shops(@PathVariable String id) {
        owners.findById(id); // 404s if the owner does not exist
        return shops.findByOwner(id).stream().map(this::toResponse).toList();
    }

    @Operation(summary = "Register a shop under an owner", description = "Requires the ADMIN role.")
    @PostMapping("/{id}/shops")
    @ResponseStatus(HttpStatus.CREATED)
    public ShopResponse createShop(@PathVariable String id, @Valid @RequestBody CreateShopRequest request) {
        owners.findById(id); // 404s if the owner does not exist
        Shop created = shops.create(new CreateShopCommand(
                id,
                request.name(),
                request.type(),
                request.whatsappNumber(),
                request.phone(),
                request.address(),
                request.locationUrl(),
                request.openingTime(),
                request.closingTime(),
                request.maxChairs()));
        return ShopResponse.from(created, 0); // brand new — no staff registered yet
    }

    private ShopResponse toResponse(Shop shop) {
        return ShopResponse.from(shop, shops.onDutyChairCount(shop.id()));
    }
}
