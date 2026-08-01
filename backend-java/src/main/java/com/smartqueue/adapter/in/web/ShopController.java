package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.CreateShopRequest;
import com.smartqueue.adapter.in.web.dto.ShopResponse;
import com.smartqueue.adapter.in.web.security.AuthenticatedUser;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.domain.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /** Onboarding is SUPER_ADMIN-only; opening/closing also allows the shop's own owner. */
    private static final String SUPER_ADMIN = "hasRole('SUPER_ADMIN')";
    private static final String SHOP_MANAGER = "hasAnyRole('SUPER_ADMIN', 'SHOP_OWNER')";

    private final ManageShopsUseCase shops;

    public ShopController(ManageShopsUseCase shops) {
        this.shops = shops;
    }

    /** Any authenticated staff/admin can list shops. Closed shops are omitted. */
    @Operation(summary = "List open shops", description = "Closed shops are hidden — fetch one directly by id instead.")
    @GetMapping
    public List<ShopResponse> findAll() {
        return shops.findAll().stream().map(ShopResponse::from).toList();
    }

    /** Unlike the list, a closed shop is still reachable directly — staff need this to reopen it. */
    @Operation(summary = "Fetch one shop", description = "Works for closed shops too, unlike the list.")
    @GetMapping("/{id}")
    public ShopResponse findOne(@PathVariable String id) {
        return ShopResponse.from(shops.findById(id));
    }

    /** Only the SaaS super-admin onboards new shops. */
    @Operation(summary = "Onboard a new shop", description = "Requires the SUPER_ADMIN role.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(SUPER_ADMIN)
    public ShopResponse create(@Valid @RequestBody CreateShopRequest request) {
        return ShopResponse.from(shops.create(
                new CreateShopCommand(
                        request.name(), request.whatsappNumber(), request.address(), request.avgServiceTime())));
    }

    /** Closing hides the shop from {@link #findAll} and stops it accepting new queue joins. */
    @Operation(
            summary = "Close a shop",
            description = "Requires SUPER_ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping("/{id}/close")
    @PreAuthorize(SHOP_MANAGER)
    public ShopResponse close(@PathVariable String id, @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(id, caller);
        return ShopResponse.from(shops.close(id));
    }

    @Operation(
            summary = "Reopen a shop",
            description = "Requires SUPER_ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping("/{id}/open")
    @PreAuthorize(SHOP_MANAGER)
    public ShopResponse open(@PathVariable String id, @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(id, caller);
        return ShopResponse.from(shops.open(id));
    }

    /**
     * hasAnyRole above only proves the caller is *a* SHOP_OWNER, not the owner of *this*
     * shop — a SHOP_OWNER whose token carries a different shopId must be rejected here.
     */
    private static void requireCanManage(String shopId, AuthenticatedUser caller) {
        if (caller.role() != Role.SUPER_ADMIN && !shopId.equals(caller.shopId())) {
            throw new AccessDeniedException("Not this shop's owner");
        }
    }
}
