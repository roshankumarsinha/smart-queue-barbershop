package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.UserJpaEntity;
import com.smartqueue.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, String> {

    Optional<UserJpaEntity> findByEmailAndRole(String email, Role role);

    Optional<UserJpaEntity> findByPhoneAndRole(String phone, Role role);
}
