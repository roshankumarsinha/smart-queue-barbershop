package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.domain.model.Shop;

import java.util.List;

public interface ManageShopsUseCase {

    /** Open shops only — a closed shop is still reachable via {@link #findById}. */
    List<Shop> findAll();

    /** Every shop belonging to one owner, oldest first (open and closed alike). */
    List<Shop> findByOwner(String ownerId);

    Shop findById(String shopId);

    Shop create(CreateShopCommand command);

    /** Hides the shop from {@link #findAll} and stops it accepting new queue joins. */
    Shop close(String shopId);

    Shop open(String shopId);
}
