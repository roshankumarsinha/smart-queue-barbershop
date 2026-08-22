package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageStaffUseCase;
import com.smartqueue.application.port.in.command.CreateStaffCommand;
import com.smartqueue.application.port.in.command.UpdateStaffPinCommand;
import com.smartqueue.application.port.out.PasswordHasher;
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
    private final PasswordHasher hasher;

    public StaffService(UserRepository users, PasswordHasher hasher) {
        this.users = users;
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
                existing.active());
        return users.save(updated);
    }

    private User requireStaffOfShop(String shopId, String staffId) {
        return users.findById(staffId)
                .filter(u -> u.role() == Role.BARBER_STAFF && shopId.equals(u.shopId()))
                .orElseThrow(() -> new NotFoundException("Staff not found"));
    }
}
