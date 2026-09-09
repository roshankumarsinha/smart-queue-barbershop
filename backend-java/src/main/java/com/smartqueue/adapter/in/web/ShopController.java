package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.ShopResponse;
import com.smartqueue.adapter.in.web.dto.ShopStatusResponse;
import com.smartqueue.adapter.in.web.dto.UpdateShopRequest;
import com.smartqueue.adapter.in.web.security.AuthenticatedUser;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.UpdateShopCommand;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.model.Shop;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private static final String SHOP_MANAGER = "hasAnyRole('ADMIN', 'SHOP_OWNER')";

    private final ManageShopsUseCase shops;

    public ShopController(ManageShopsUseCase shops) {
        this.shops = shops;
    }

    /** Any authenticated staff/admin can list shops. Closed shops are omitted. */
    @Operation(summary = "List open shops", description = "Closed shops are hidden — fetch one directly by id instead.")
    @GetMapping
    public List<ShopResponse> findAll() {
        return shops.findAll().stream().map(this::toResponse).toList();
    }

    /** Unlike the list, a closed shop is still reachable directly — staff need this to reopen it. */
    @Operation(summary = "Fetch one shop", description = "Works for closed shops too, unlike the list.")
    @GetMapping("/{id}")
    public ShopResponse findOne(@PathVariable String id) {
        return toResponse(shops.findById(id));
    }

    /**
     * An owner's own shop list, self-service — unlike {@code GET /owners/{id}/shops},
     * which is the ADMIN-only drill-down and requires already knowing the owner's id.
     * Open and closed alike, so an owner can still reach a closed shop to reopen it.
     */
    @Operation(summary = "List my shops", description = "Every shop owned by the signed-in SHOP_OWNER.")
    @GetMapping("/mine")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public List<ShopResponse> mine(@AuthenticationPrincipal AuthenticatedUser caller) {
        return shops.findByOwner(caller.userId()).stream().map(this::toResponse).toList();
    }

    /**
     * Partial update: omitted fields keep their current value. Reassigning the shop to a
     * different owner is admin-only — an owner must not be able to hand their own shop
     * (and its queue history) to someone else.
     */
    @Operation(
            summary = "Update a shop",
            description = "Send only the fields that changed. Reassigning ownerId requires ADMIN.")
    @PatchMapping("/{id}")
    @PreAuthorize(SHOP_MANAGER)
    public ShopResponse update(
            @PathVariable String id,
            @Valid @RequestBody UpdateShopRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(id, caller);
        if (request.ownerId() != null && caller.role() != Role.ADMIN) {
            throw new AccessDeniedException("Only an admin can reassign a shop's owner");
        }
        return toResponse(shops.update(id, new UpdateShopCommand(
                request.ownerId(),
                request.name(),
                request.type(),
                request.whatsappNumber(),
                request.phone(),
                request.address(),
                request.locationUrl(),
                request.openingTime(),
                request.closingTime(),
                request.maxChairs())));
    }

    /**
     * Reopens a NEW/CLOSED shop so it takes customers again. This is the owner-driven
     * counterpart to {@link #close}; a shop also opens itself automatically when a barber
     * (or an unstaffed shop's own owner) logs in during business hours, see
     * {@link com.smartqueue.application.service.ShopService#checkInForLogin}.
     */
    @Operation(
            summary = "Open a shop",
            description = "Requires ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping("/{id}/open")
    @PreAuthorize(SHOP_MANAGER)
    public ShopStatusResponse open(@PathVariable String id, @AuthenticationPrincipal AuthenticatedUser caller) {
        return ShopStatusResponse.from(shops.open(requireCanManage(id, caller).id()));
    }

    /**
     * Closing hides the shop from {@link #findAll} and stops it accepting new queue joins.
     * Within business hours it's just a pause (status only); outside hours it also resets
     * the shop — fresh token cycle, cleared queue, all staff off duty — see
     * {@link com.smartqueue.application.service.ShopService#close}.
     */
    @Operation(
            summary = "Close a shop",
            description = "Requires ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping("/{id}/close")
    @PreAuthorize(SHOP_MANAGER)
    public ShopStatusResponse close(@PathVariable String id, @AuthenticationPrincipal AuthenticatedUser caller) {
        return ShopStatusResponse.from(shops.close(requireCanManage(id, caller).id()));
    }

    private ShopResponse toResponse(Shop shop) {
        return ShopResponse.from(shop, shops.onDutyChairCount(shop.id()));
    }

    /**
     * hasAnyRole above only proves the caller is *a* SHOP_OWNER, not the owner of *this*
     * shop. Ownership now lives on the shop ({@code owner_id}), so we load the shop and
     * check it against the caller's own user id. Returns the shop so callers reuse it.
     */
    private Shop requireCanManage(String shopId, AuthenticatedUser caller) {
        Shop shop = shops.findById(shopId);
        if (caller.role() != Role.ADMIN && !caller.userId().equals(shop.ownerId())) {
            throw new AccessDeniedException("Not this shop's owner");
        }
        return shop;
    }
}
