package com.smartqueue.application.port.out;

import com.smartqueue.domain.Role;
import com.smartqueue.domain.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {

    Optional<User> findById(String userId);

    /** Like {@link #findById} but refuses a user whose role differs — used for owner lookups. */
    Optional<User> findByIdAndRole(String userId, Role role);

    /**
     * Lookups are scoped to the role on purpose: an owner must not be able to sign in
     * through the admin tab just because the password happens to match.
     */
    Optional<User> findByEmailAndRole(String email, Role role);

    Optional<User> findByPhoneAndRole(String phone, Role role);

    /** All users of a role, oldest first. */
    List<User> findAllByRole(Role role);

    /** A shop's staff of a given role (e.g. its barbers), oldest first. */
    List<User> findByShopIdAndRole(String shopId, Role role);

    /** The on-duty roster of a given role — each is one concurrent chair. */
    List<User> findByShopIdAndRoleAndOnDutyTrue(String shopId, Role role);

    /** Email is globally unique across roles, so this check is role-agnostic. */
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    User save(User user);

    void deleteById(String userId);
}
