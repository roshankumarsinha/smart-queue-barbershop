package com.smartqueue.config;

import com.smartqueue.application.port.out.PasswordHasher;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.Role;
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
            Shop shop = shops.findById(DEMO_SHOP_ID)
                    .orElseGet(() -> shops.save(new Shop(
                            DEMO_SHOP_ID, "Downtown Cuts", "+10000000000", 18, true, null, null)));

            ensureUser(users, Role.SHOP_OWNER, "owner@shop.com", null, () -> new User(
                    null, Role.SHOP_OWNER, "Shop Owner", "owner@shop.com",
                    hasher.hash("secret123"), null, null, shop.id()));

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

    private static void ensureUser(
            UserRepository users,
            Role role,
            String email,
            String phone,
            java.util.function.Supplier<User> factory) {
        boolean exists = email != null
                ? users.findByEmailAndRole(email, role).isPresent()
                : users.findByPhoneAndRole(phone, role).isPresent();
        if (!exists) {
            users.save(factory.get());
        }
    }
}
