package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.CreateStaffCommand;
import com.smartqueue.application.port.in.command.UpdateStaffPinCommand;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;

import java.util.List;

/**
 * The barbers registered at a shop. Callers (the web layer) authorize access to the
 * shop first and pass the loaded {@link Shop} in where it's needed — same convention
 * as {@link ManageServicesUseCase}.
 */
public interface ManageStaffUseCase {

    /** A shop's barbers, oldest first. */
    List<User> findByShop(String shopId);

    User create(Shop shop, CreateStaffCommand command);

    /**
     * Removes a barber's account outright — unlike an owner, deleting them doesn't
     * orphan anything else. Freeing their phone number also means re-registering the
     * same person later (same phone) is indistinguishable from hiring someone new —
     * that's intentional, not a gap: there's nothing here to "reactivate" instead.
     */
    void remove(String shopId, String staffId);

    /** Resets sign-in PIN. No old PIN required — this is an admin/owner action, not self-service. */
    User updatePin(String shopId, String staffId, UpdateStaffPinCommand command);
}
