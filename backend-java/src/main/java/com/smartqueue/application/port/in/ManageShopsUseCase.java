package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.application.port.in.command.UpdateShopCommand;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;

import java.util.List;

public interface ManageShopsUseCase {

    /** Open shops only — a closed shop is still reachable via {@link #findById}. */
    List<Shop> findAll();

    /** Every shop belonging to one owner, oldest first (open and closed alike). */
    List<Shop> findByOwner(String ownerId);

    Shop findById(String shopId);

    Shop create(CreateShopCommand command);

    /** Partial update — null fields on the command keep their current value. */
    Shop update(String shopId, UpdateShopCommand command);

    /** Hides the shop from {@link #findAll} and stops it accepting new queue joins. */
    Shop close(String shopId);

    /**
     * How many chairs this shop has open right now — its on-duty barbers, plus its owner
     * too if they're also working the floor (an owner can go on duty just like a barber).
     */
    int onDutyChairCount(String shopId);

    /**
     * The auto check-in triggered by a successful login, for whichever of this user's
     * shop(s) are eligible — a barber's own shop; an owner's shops that have no barbers
     * registered.
     */
    void checkInForLogin(User user);
}
