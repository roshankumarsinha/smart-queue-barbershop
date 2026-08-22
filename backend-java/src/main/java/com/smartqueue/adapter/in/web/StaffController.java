package com.smartqueue.adapter.in.web;

import com.smartqueue.adapter.in.web.dto.CreateStaffRequest;
import com.smartqueue.adapter.in.web.dto.StaffResponse;
import com.smartqueue.adapter.in.web.dto.UpdateStaffPinRequest;
import com.smartqueue.adapter.in.web.security.AuthenticatedUser;
import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.ManageStaffUseCase;
import com.smartqueue.application.port.in.command.CreateStaffCommand;
import com.smartqueue.application.port.in.command.UpdateStaffPinCommand;
import com.smartqueue.domain.Role;
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
 * The barbers registered at a shop. Both viewing and registering are allowed for
 * ADMIN or that shop's own owner — unlike services, staff isn't restricted to
 * ADMIN-only, since an owner staffing their own shop is exactly what SHOP_OWNER
 * accounts are for.
 */
@RestController
@RequestMapping("/shops/{shopId}/staff")
@Tag(name = "Staff", description = "Barbers registered at a shop")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SHOP_OWNER')")
public class StaffController {

    private final ManageShopsUseCase shops;
    private final ManageStaffUseCase staff;

    public StaffController(ManageShopsUseCase shops, ManageStaffUseCase staff) {
        this.shops = shops;
        this.staff = staff;
    }

    @Operation(summary = "List a shop's staff")
    @GetMapping
    public List<StaffResponse> findAll(
            @PathVariable String shopId, @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(shopId, caller);
        return staff.findByShop(shopId).stream().map(StaffResponse::from).toList();
    }

    @Operation(
            summary = "Register a staff member",
            description = "Requires ADMIN, or the SHOP_OWNER of this specific shop.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse add(
            @PathVariable String shopId,
            @Valid @RequestBody CreateStaffRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller) {
        Shop shop = requireCanManage(shopId, caller);
        return StaffResponse.from(staff.create(
                shop, new CreateStaffCommand(request.name(), request.phone(), request.pin())));
    }

    @Operation(
            summary = "Reset a staff member's PIN",
            description = "Requires ADMIN, or the SHOP_OWNER of this specific shop. No old PIN needed.")
    @PatchMapping("/{staffId}/pin")
    public StaffResponse updatePin(
            @PathVariable String shopId,
            @PathVariable String staffId,
            @Valid @RequestBody UpdateStaffPinRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller) {
        requireCanManage(shopId, caller);
        return StaffResponse.from(staff.updatePin(shopId, staffId, new UpdateStaffPinCommand(request.pin())));
    }

    @Operation(summary = "Remove a staff member", description = "Requires the ADMIN role.")
    @DeleteMapping("/{staffId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void remove(@PathVariable String shopId, @PathVariable String staffId) {
        staff.remove(shopId, staffId);
    }

    /** Loads the shop and proves the caller is the admin or this shop's owner. Returns it for reuse. */
    private Shop requireCanManage(String shopId, AuthenticatedUser caller) {
        Shop shop = shops.findById(shopId);
        if (caller.role() != Role.ADMIN && !caller.userId().equals(shop.ownerId())) {
            throw new AccessDeniedException("Not this shop's owner");
        }
        return shop;
    }
}
