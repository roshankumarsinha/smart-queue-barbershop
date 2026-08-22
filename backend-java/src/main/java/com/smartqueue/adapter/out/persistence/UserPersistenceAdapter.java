package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.repository.UserJpaRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.model.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class UserPersistenceAdapter implements UserRepository {

    private final UserJpaRepository users;

    UserPersistenceAdapter(UserJpaRepository users) {
        this.users = users;
    }

    @Override
    public Optional<User> findById(String userId) {
        return users.findById(userId).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<User> findByIdAndRole(String userId, Role role) {
        return users.findByIdAndRole(userId, role).map(PersistenceMapper::toDomain);
    }

    @Override
    public List<User> findAllByRole(Role role) {
        return users.findAllByRoleOrderByCreatedAtAsc(role).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public List<User> findByShopIdAndRole(String shopId, Role role) {
        return users.findByShopIdAndRoleOrderByCreatedAtAsc(shopId, role).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByEmail(String email) {
        return email != null && users.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return phone != null && users.existsByPhone(phone);
    }

    @Override
    public Optional<User> findByEmailAndRole(String email, Role role) {
        if (email == null) {
            return Optional.empty();
        }
        return users.findByEmailAndRole(email, role).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<User> findByPhoneAndRole(String phone, Role role) {
        if (phone == null) {
            return Optional.empty();
        }
        return users.findByPhoneAndRole(phone, role).map(PersistenceMapper::toDomain);
    }

    @Override
    public User save(User user) {
        return PersistenceMapper.toDomain(users.saveAndFlush(PersistenceMapper.toEntity(user)));
    }

    @Override
    public void deleteById(String userId) {
        users.deleteById(userId);
    }
}
