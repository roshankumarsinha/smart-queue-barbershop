package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.UserJpaEntity;
import com.smartqueue.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, String> {

    Optional<UserJpaEntity> findByIdAndRole(String id, Role role);

    Optional<UserJpaEntity> findByEmailAndRole(String email, Role role);

    Optional<UserJpaEntity> findByPhoneAndRole(String phone, Role role);

    List<UserJpaEntity> findAllByRoleOrderByCreatedAtAsc(Role role);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}
