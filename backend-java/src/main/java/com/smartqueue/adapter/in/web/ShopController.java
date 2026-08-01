package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.CreateShopRequest;
import com.smartqueue.adapter.in.web.dto.ShopResponse;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.CreateShopCommand;
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

/** Every route here requires authentication (see SecurityConfig). */
@RestController
@RequestMapping("/shops")
@Tag(name = "Shops", description = "Barbershop tenants")
@SecurityRequirement(name = "bearerAuth")
public class ShopController {

    private final ManageShopsUseCase shops;

    public ShopController(ManageShopsUseCase shops) {
        this.shops = shops;
    }

    /** Any authenticated staff/admin can list shops. */
    @Operation(summary = "List all shops")
    @GetMapping
    public List<ShopResponse> findAll() {
        return shops.findAll().stream().map(ShopResponse::from).toList();
    }

    @Operation(summary = "Fetch one shop")
    @GetMapping("/{id}")
    public ShopResponse findOne(@PathVariable String id) {
        return ShopResponse.from(shops.findById(id));
    }

    /** Only the SaaS super-admin onboards new shops. */
    @Operation(summary = "Onboard a new shop", description = "Requires the SUPER_ADMIN role.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ShopResponse create(@Valid @RequestBody CreateShopRequest request) {
        return ShopResponse.from(shops.create(
                new CreateShopCommand(request.name(), request.whatsappNumber(), request.avgServiceTime())));
    }
}
