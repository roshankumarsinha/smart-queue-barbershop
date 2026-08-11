package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.ShopResponse;
import com.smartqueue.adapter.in.web.security.AuthenticatedUser;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.model.Shop;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Shop lifecycle (list / fetch / open / close). Registering a shop lives on the
 * owner sub-resource ({@code POST /owners/{id}/shops}) since a shop is always
 * created under an owner — see {@link OwnerController}. Every route requires a token.
 */
@RestController
@RequestMapping("/shops")
@Tag(name = "Shops", description = "Venue tenants")
@SecurityRequirement(name = "bearerAuth")
public class ShopController {

    /** Opening/closing allows the SaaS admin or the shop's own owner. */
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

    /** Closing hides the shop from {@link #findAll} and stops it accepting new queue joins. */
    @Operation(
            summary = "Close a shop",
            description = "Requires SUPER_ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping("/{id}/close")
    @PreAuthorize(SHOP_MANAGER)
    public ShopResponse close(@PathVariable String id, @AuthenticationPrincipal AuthenticatedUser caller) {
        return ShopResponse.from(shops.close(requireCanManage(id, caller).id()));
    }

    @Operation(
            summary = "Reopen a shop",
            description = "Requires SUPER_ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping("/{id}/open")
    @PreAuthorize(SHOP_MANAGER)
    public ShopResponse open(@PathVariable String id, @AuthenticationPrincipal AuthenticatedUser caller) {
        return ShopResponse.from(shops.open(requireCanManage(id, caller).id()));
    }

    /**
     * hasAnyRole above only proves the caller is *a* SHOP_OWNER, not the owner of *this*
     * shop. Ownership now lives on the shop ({@code owner_id}), so we load the shop and
     * check it against the caller's own user id. Returns the shop so callers reuse it.
     */
    private Shop requireCanManage(String shopId, AuthenticatedUser caller) {
        Shop shop = shops.findById(shopId);
        if (caller.role() != Role.SUPER_ADMIN && !caller.userId().equals(shop.ownerId())) {
            throw new AccessDeniedException("Not this shop's owner");
        }
        return shop;
    }
}
