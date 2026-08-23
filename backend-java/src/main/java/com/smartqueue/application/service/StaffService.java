package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageStaffUseCase;
import com.smartqueue.application.port.in.command.CreateStaffCommand;
import com.smartqueue.application.port.in.command.UpdateStaffPinCommand;
import com.smartqueue.application.port.out.PasswordHasher;
import com.smartqueue.application.port.out.QueueEntryRepository;
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
public class StaffService implements ManageStaffUseCase {

    private final UserRepository users;
    private final QueueEntryRepository entries;
    private final PasswordHasher hasher;

    public StaffService(UserRepository users, QueueEntryRepository entries, PasswordHasher hasher) {
        this.users = users;
        this.entries = entries;
        this.hasher = hasher;
    }

    @Override
    public List<User> findByShop(String shopId) {
        return users.findByShopIdAndRole(shopId, Role.BARBER_STAFF);
    }

    /**
     * Phone is how a barber signs in and is globally unique across every user (owners,
     * admins, other barbers alike) — pre-checked here for a clean 409 instead of a raw
     * constraint violation. The PIN is hashed before it ever reaches persistence, same
     * as an owner's password in {@code OwnerService}.
     */
    @Override
    @Transactional
    public User create(Shop shop, CreateStaffCommand command) {
        String phone = command.phone().trim();
        if (users.existsByPhone(phone)) {
            throw new ConflictException("A user with this phone number already exists");
        }
        return users.save(new User(
                null,
                Role.BARBER_STAFF,
                command.name().trim(),
                null,
                null,
                phone,
                hasher.hash(command.pin()),
                shop.id()));
    }

    /**
     * A real delete, not a deactivation like {@code OwnerService.deactivate} — a
     * barber has no shops or history hanging off their id the way an owner does, so
     * there's nothing left to orphan. {@code shopId} is checked, not just the id, so
     * this can't be used to delete a barber at a shop the caller wasn't shown.
     */
    @Override
    @Transactional
    public void remove(String shopId, String staffId) {
        users.deleteById(requireStaffOfShop(shopId, staffId).id());
    }

    /**
     * Resets the PIN without requiring the old one — the admin/owner is acting on
     * someone else's account (e.g. the barber forgot it, or a shared tablet's PIN
     * needs rotating), not confirming their own identity to change it.
     */
    @Override
    @Transactional
    public User updatePin(String shopId, String staffId, UpdateStaffPinCommand command) {
        User existing = requireStaffOfShop(shopId, staffId);
        User updated = new User(
                existing.id(),
                existing.role(),
                existing.name(),
                existing.email(),
                existing.passwordHash(),
                existing.phone(),
                hasher.hash(command.pin()),
                existing.shopId(),
                existing.active(),
                existing.onDuty());
        return users.save(updated);
    }

    /**
     * Going off duty is refused while this person currently has someone IN_SERVICE — they
     * must finish or hand off first, so a customer is never silently orphaned mid-service.
     * {@code userId} may be one of this shop's barbers, or the shop's own owner — an owner
     * who also works the floor is just as much a chair as any barber.
     */
    @Override
    @Transactional
    public User setOnDuty(Shop shop, String userId, boolean onDuty) {
        User existing = requireChairEligible(shop, userId);
        if (!onDuty && entries.findActiveByServedBy(userId).isPresent()) {
            throw new ConflictException("Finish or hand off your current customer before going off duty");
        }
        return users.save(onDuty ? existing.onDutyOn() : existing.onDutyOff());
    }

    private User requireStaffOfShop(String shopId, String staffId) {
        return users.findById(staffId)
                .filter(u -> u.role() == Role.BARBER_STAFF && shopId.equals(u.shopId()))
                .orElseThrow(() -> new NotFoundException("Staff not found"));
    }

    /** Anyone who can be a chair at this shop: one of its barbers, or the shop's own owner. */
    private User requireChairEligible(Shop shop, String userId) {
        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("Staff not found"));
        boolean isBarberHere = user.role() == Role.BARBER_STAFF && shop.id().equals(user.shopId());
        boolean isThisOwner = user.role() == Role.SHOP_OWNER && user.id().equals(shop.ownerId());
        if (!isBarberHere && !isThisOwner) {
            throw new NotFoundException("Staff not found");
        }
        return user;
    }
}
