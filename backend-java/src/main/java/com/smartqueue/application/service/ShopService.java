package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageShopsUseCase;
import com.smartqueue.application.port.in.command.CreateShopCommand;
import com.smartqueue.application.port.in.command.UpdateShopCommand;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
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
                command.closingTime(),
                command.maxChairs());
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
                merge(command.closingTime(), existing.closingTime()),
                merge(command.maxChairs(), existing.maxChairs()));

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
    public int onDutyChairCount(String shopId) {
        Shop shop = findById(shopId);
        int barbers = users.findByShopIdAndRoleAndOnDutyTrue(shopId, Role.BARBER_STAFF).size();
        boolean ownerOnDuty = users.findById(shop.ownerId()).map(User::onDuty).orElse(false);
        return barbers + (ownerOnDuty ? 1 : 0);
    }

    @Override
    @Transactional
    public void checkInForLogin(User user) {
        List<String> eligibleShopIds = eligibleShopIdsForLogin(user);
        if (eligibleShopIds.isEmpty()) {
            return;
        }
        eligibleShopIds.forEach(this::openIfWithinHours);

        LocalTime now = LocalTime.now();
        boolean withinHoursSomewhere = eligibleShopIds.stream()
                .map(this::findById)
                .anyMatch(shop -> isWithinHours(shop, now));
        syncOnDuty(user.id(), withinHoursSomewhere);
    }

    /** A barber's own shop; an owner's shops that have no barbers registered. Empty for anyone else. */
    private List<String> eligibleShopIdsForLogin(User user) {
        if (user.role() == Role.BARBER_STAFF) {
            return user.shopId() != null ? List.of(user.shopId()) : List.of();
        }
        if (user.role() == Role.SHOP_OWNER) {
            return shops.findByOwnerId(user.id()).stream()
                    .filter(shop -> users.findByShopIdAndRole(shop.id(), Role.BARBER_STAFF).isEmpty())
                    .map(Shop::id)
                    .toList();
        }
        return List.of();
    }

    /**
     * The actual auto-open write: no-op unless the shop is not already OPEN and is
     * currently within hours.
     */
    private void openIfWithinHours(String shopId) {
        Shop shop = findById(shopId);
        if (shop.status() == ShopStatus.OPEN) {
            return;
        }
        if (isWithinHours(shop, LocalTime.now())) {
            shops.save(shop.opened());
        }
    }

    /**
     * No hours configured means "never within hours" — this is what keeps an unset-hours
     * shop from auto-opening (see {@link #openIfWithinHours}) and its owner from getting
     * auto-checked-in. Simple same-day window — hours spanning midnight aren't handled
     * specially.
     */
    private static boolean isWithinHours(Shop shop, LocalTime now) {
        if (shop.openingTime() == null || shop.closingTime() == null) {
            return false;
        }
        return !now.isBefore(shop.openingTime()) && now.isBefore(shop.closingTime());
    }

    /**
     * Logging in outside business hours forces the barber/owner back off duty — not just
     * "skip turning it on" — since arriving before opening or lingering past closing
     * shouldn't keep counting as an available chair.
     */
    private void syncOnDuty(String userId, boolean onDuty) {
        users.findById(userId)
                .filter(u -> u.onDuty() != onDuty)
                .ifPresent(u -> users.save(onDuty ? u.onDutyOn() : u.onDutyOff()));
    }
}
