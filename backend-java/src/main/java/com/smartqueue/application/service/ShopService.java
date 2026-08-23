package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.application.port.in.command.UpdateShopCommand;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ShopService implements ManageShopsUseCase {

    private final ShopRepository shops;
    private final UserRepository users;

    public ShopService(ShopRepository shops, UserRepository users) {
        this.shops = shops;
        this.users = users;
    }

    @Override
    public List<Shop> findAll() {
        return shops.findAllByCreatedAt().stream().filter(Shop::active).toList();
    }

    @Override
    public List<Shop> findByOwner(String ownerId) {
        return shops.findByOwnerId(ownerId);
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
        Shop shop = Shop.opening(
                command.ownerId(),
                command.name(),
                command.type(),
                command.whatsappNumber(),
                command.phone(),
                command.address(),
                command.locationUrl(),
                command.openingTime(),
                command.closingTime());
        if (shop.whatsappNumber() != null && shops.existsByWhatsappNumber(shop.whatsappNumber())) {
            throw new ConflictException("A shop with this WhatsApp number already exists");
        }
        return shops.save(shop);
    }

    /**
     * Null command fields keep the shop's current value, so a caller can send just the
     * one field they changed. The WhatsApp uniqueness check only runs when the number
     * actually changes — otherwise a shop would collide with its own existing row.
     */
    @Override
    @Transactional
    public Shop update(String shopId, UpdateShopCommand command) {
        Shop existing = findById(shopId);
        Shop updated = existing.withProfile(
                merge(command.ownerId(), existing.ownerId()),
                merge(command.name(), existing.name()),
                merge(command.type(), existing.type()),
                merge(command.whatsappNumber(), existing.whatsappNumber()),
                merge(command.phone(), existing.phone()),
                merge(command.address(), existing.address()),
                merge(command.locationUrl(), existing.locationUrl()),
                merge(command.openingTime(), existing.openingTime()),
                merge(command.closingTime(), existing.closingTime()));

        if (!updated.ownerId().equals(existing.ownerId())) {
            // Without this the reassignment would fail as a raw FK violation (500).
            users.findByIdAndRole(updated.ownerId(), Role.SHOP_OWNER)
                    .orElseThrow(() -> new NotFoundException("Owner not found"));
        }
        if (updated.whatsappNumber() != null
                && !updated.whatsappNumber().equals(existing.whatsappNumber())
                && shops.existsByWhatsappNumber(updated.whatsappNumber())) {
            throw new ConflictException("A shop with this WhatsApp number already exists");
        }
        return shops.save(updated);
    }

    private static <T> T merge(T incoming, T current) {
        return incoming != null ? incoming : current;
    }

    @Override
    @Transactional
    public Shop close(String shopId) {
        return shops.save(findById(shopId).closed());
    }

    @Override
    @Transactional
    public Shop open(String shopId) {
        return shops.save(findById(shopId).opened());
    }

    @Override
    public int onDutyChairCount(String shopId) {
        Shop shop = findById(shopId);
        int barbers = users.findByShopIdAndRoleAndOnDutyTrue(shopId, Role.BARBER_STAFF).size();
        boolean ownerOnDuty = users.findById(shop.ownerId()).map(User::onDuty).orElse(false);
        return barbers + (ownerOnDuty ? 1 : 0);
    }
}
