package com.smartqueue.config;

import com.smartqueue.application.port.out.PasswordHasher;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.ShopType;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Demo data so the frontend login works immediately — the equivalent of
 * prisma/seed.ts. Idempotent: it only inserts what is missing. Disable with
 * {@code SEED_DEMO_DATA=false} in any environment that is not a sandbox.
 */
@Configuration
@ConditionalOnProperty(name = "smartqueue.seed.demo-data", havingValue = "true")
class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String DEMO_SHOP_ID = "demo-shop";

    // Each repository call runs in its own transaction, which is all the atomicity
    // idempotent inserts need here.
    @Bean
    ApplicationRunner seedDemoData(ShopRepository shops, UserRepository users, PasswordHasher hasher) {
        return args -> {
            // Owner and shop reference each other (users.shop_id <-> shops.owner_id), so
            // they are seeded in FK order: owner first with no shop, then the shop
            // pointing at the owner, then the owner is linked back to the shop.
            User owner = ensureUser(users, Role.SHOP_OWNER, "owner@shop.com", null, () -> new User(
                    null, Role.SHOP_OWNER, "Shop Owner", "owner@shop.com",
                    hasher.hash("secret123"), null, null, null));

            Shop shop = shops.findById(DEMO_SHOP_ID)
                    .orElseGet(() -> shops.save(new Shop(
                            DEMO_SHOP_ID, owner.id(), "Downtown Cuts", ShopType.SALON,
                            "+10000000000", null, "221B Baker Street", null,
                            ShopStatus.OPEN, null, null, null, null)));

            // Give the demo owner a default "active shop" so the single-shop owner
            // dashboard keeps working until the multi-shop switcher lands. New owners
            // created via the admin flow own shops through owner_id and have no default.
            if (owner.shopId() == null) {
                users.save(new User(
                        owner.id(), owner.role(), owner.name(), owner.email(),
                        owner.passwordHash(), owner.phone(), owner.pinHash(), shop.id()));
            }

            ensureUser(users, Role.BARBER_STAFF, null, "9876543210", () -> new User(
                    null, Role.BARBER_STAFF, "Barber", null, null,
                    "9876543210", hasher.hash("1234"), shop.id()));

            ensureUser(users, Role.SUPER_ADMIN, "admin@smartqueue.app", null, () -> new User(
                    null, Role.SUPER_ADMIN, "Super Admin", "admin@smartqueue.app",
                    hasher.hash("admin123"), null, null, null));

            log.info("Seeded demo data — shop: {} ({})", shop.name(), shop.id());
            log.info("  Owner:  owner@shop.com / secret123");
            log.info("  Barber: 9876543210 / 1234");
            log.info("  Admin:  admin@smartqueue.app / admin123");
        };
    }

    /** Returns the existing user for this role/identifier, or the freshly-saved one. */
    private static User ensureUser(
            UserRepository users,
            Role role,
            String email,
            String phone,
            java.util.function.Supplier<User> factory) {
        return (email != null
                        ? users.findByEmailAndRole(email, role)
                        : users.findByPhoneAndRole(phone, role))
                .orElseGet(() -> users.save(factory.get()));
    }
}
