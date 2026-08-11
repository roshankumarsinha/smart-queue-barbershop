package com.smartqueue.application.service;

import com.smartqueue.application.port.in.ManageOwnersUseCase;
import com.smartqueue.application.port.in.command.CreateOwnerCommand;
import com.smartqueue.application.port.in.result.OwnerAccount;
import com.smartqueue.application.port.out.PasswordHasher;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.exception.ConflictException;
import com.smartqueue.domain.exception.NotFoundException;
import com.smartqueue.domain.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class OwnerService implements ManageOwnersUseCase {

    private final UserRepository users;
    private final ShopRepository shops;
    private final PasswordHasher hasher;

    public OwnerService(UserRepository users, ShopRepository shops, PasswordHasher hasher) {
        this.users = users;
        this.shops = shops;
        this.hasher = hasher;
    }

    /**
     * The admin types the initial password; it is hashed here so plaintext never
     * reaches persistence. Email is globally unique (owners sign in with it), and a
     * phone, if supplied, must be unique too — both are pre-checked to return a clean
     * 409 rather than surfacing a raw constraint violation.
     */
    @Override
    @Transactional
    public OwnerAccount createOwner(CreateOwnerCommand command) {
        String email = normalize(command.email());
        String phone = blankToNull(command.phone());

        if (email == null) {
            throw new ConflictException("An owner needs an email to sign in with");
        }
        if (users.existsByEmail(email)) {
            throw new ConflictException("A user with this email already exists");
        }
        if (phone != null && users.existsByPhone(phone)) {
            throw new ConflictException("A user with this phone number already exists");
        }

        User saved = users.save(new User(
                null,
                Role.SHOP_OWNER,
                command.name().trim(),
                email,
                hasher.hash(command.password()),
                phone,
                null,
                null));
        return new OwnerAccount(saved, 0);
    }

    @Override
    public List<OwnerAccount> findAll() {
        return users.findAllByRole(Role.SHOP_OWNER).stream()
                .map(owner -> new OwnerAccount(owner, shops.countByOwnerId(owner.id())))
                .toList();
    }

    @Override
    public OwnerAccount findById(String ownerId) {
        User owner = users.findByIdAndRole(ownerId, Role.SHOP_OWNER)
                .orElseThrow(() -> new NotFoundException("Owner not found"));
        return new OwnerAccount(owner, shops.countByOwnerId(owner.id()));
    }

    private static String normalize(String email) {
        String cleaned = blankToNull(email);
        return cleaned == null ? null : cleaned.toLowerCase();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
