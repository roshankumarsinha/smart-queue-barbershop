package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.model.Shop;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ShopService implements ManageShopsUseCase {

    private final ShopRepository shops;

    public ShopService(ShopRepository shops) {
        this.shops = shops;
    }

    @Override
    public List<Shop> findAll() {
        return shops.findAllByCreatedAt();
    }

    @Override
    public Shop findById(String shopId) {
        return shops.findById(shopId).orElseThrow(() -> new NotFoundException("Shop not found"));
    }

    /**
     * Rejects a WhatsApp number already claimed by another shop — customers reach a shop
     * through that number, so sharing one would route them to the wrong queue.
     */
    @Override
    @Transactional
    public Shop create(CreateShopCommand command) {
        Shop shop = Shop.opening(command.name(), command.whatsappNumber(), command.avgServiceTime());
        if (shop.whatsappNumber() != null && shops.existsByWhatsappNumber(shop.whatsappNumber())) {
            throw new ConflictException("A shop with this WhatsApp number already exists");
        }
        return shops.save(shop);
    }
}
