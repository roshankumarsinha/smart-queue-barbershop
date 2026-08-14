package com.smartqueue.adapter.out.persistence.entity;

import com.smartqueue.domain.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users")
public class UserJpaEntity {

    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role;

    @Column(nullable = false)
    private String name;

    /** Owners & admins sign in with email + password. */
    @Column(unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    /** Barbers sign in with phone + PIN. */
    @Column(unique = true)
    private String phone;

    @Column(name = "pin_hash")
    private String pinHash;

    @Column(name = "shop_id")
    private String shopId;

    @Column(nullable = false)
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserJpaEntity() {
        // for JPA
    }

    public UserJpaEntity(
            String id,
            Role role,
            String name,
            String email,
            String passwordHash,
            String phone,
            String pinHash,
            String shopId,
            boolean active) {
        this.id = id;
        this.role = role;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.pinHash = pinHash;
        this.shopId = shopId;
        this.active = active;
    }

    public String getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getPhone() {
        return phone;
    }

    public String getPinHash() {
        return pinHash;
    }

    public String getShopId() {
        return shopId;
    }

    public boolean isActive() {
        return active;
    }
}
