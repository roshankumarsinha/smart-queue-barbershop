package com.smartqueue.application.port.out;

import com.smartqueue.domain.Role;
import com.smartqueue.domain.model.User;

import java.util.Optional;

public interface UserRepository {

    Optional<User> findById(String userId);

    /**
     * Lookups are scoped to the role on purpose: an owner must not be able to sign in
     * through the admin tab just because the password happens to match.
     */
    Optional<User> findByEmailAndRole(String email, Role role);

    Optional<User> findByPhoneAndRole(String phone, Role role);

    User save(User user);
}
