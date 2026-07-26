package com.smartqueue.application.port.in;

import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.domain.model.Shop;

import java.util.List;

public interface ManageShopsUseCase {

    List<Shop> findAll();

    Shop findById(String shopId);

    Shop create(CreateShopCommand command);
}
