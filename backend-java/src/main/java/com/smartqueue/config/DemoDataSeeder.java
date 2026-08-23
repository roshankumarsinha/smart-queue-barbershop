package com.smartqueue.config;

import com.smartqueue.application.port.out.PasswordHasher;
import com.smartqueue.application.port.out.QueueEntryRepository;
import com.smartqueue.application.port.out.ServiceCatalogRepository;
import com.smartqueue.application.port.out.ShopRepository;
import com.smartqueue.application.port.out.ShopServiceRepository;
import com.smartqueue.application.port.out.UserRepository;
import com.smartqueue.domain.CatalogService;
import com.smartqueue.domain.Role;
import com.smartqueue.domain.ServiceType;
import com.smartqueue.domain.ShopStatus;
import com.smartqueue.domain.ShopType;
import com.smartqueue.domain.model.QueueEntry;
import com.smartqueue.domain.model.Shop;
import com.smartqueue.domain.model.ShopService;
import com.smartqueue.domain.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.function.Supplier;

/**
 * Demo data so every screen has something to show on a fresh database: an admin, two
 * owners, three shops across the lifecycle states, priced services, and a live queue
 * with someone in the chair.
 *
 * <p>Idempotent — it only inserts what is missing, so restarting the app never
 * duplicates or resets anything. Disable with {@code SEED_DEMO_DATA=false} anywhere
 * that is not a sandbox.
 */
@Configuration
@ConditionalOnProperty(name = "smartqueue.seed.demo-data", havingValue = "true")
class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    // Fixed ids keep the seed idempotent and give the frontend stable links to demo against.
    private static final String DEMO_SHOP_ID = "demo-shop";
    private static final String SECOND_SHOP_ID = "demo-shop-uptown";
    private static final String NEW_SHOP_ID = "demo-shop-unopened";

    @Bean
    ApplicationRunner seedDemoData(
            ShopRepository shops,
            UserRepository users,
            ShopServiceRepository shopServices,
            ServiceCatalogRepository catalog,
            QueueEntryRepository queueEntries,
            PasswordHasher hasher) {
        return args -> {
            User admin = ensureUser(users, Role.ADMIN, "admin@smartqueue.app", null, () -> new User(
                    null, Role.ADMIN, "Admin", "admin@smartqueue.app",
                    hasher.hash("admin123"), null, null, null));

            // Owner and shop reference each other (users.shop_id <-> shops.owner_id), so
            // they are seeded in FK order: owner first with no shop, then the shops
            // pointing at the owner, then the owner is linked back to their main shop.
            User owner = ensureUser(users, Role.SHOP_OWNER, "owner@shop.com", null, () -> new User(
                    null, Role.SHOP_OWNER, "Shop Owner", "owner@shop.com",
                    hasher.hash("secret123"), "9000000001", null, null));

            // A second owner exists so the admin's owner list is never a list of one,
            // and so "reassign this shop's owner" has somewhere to reassign to.
            User secondOwner = ensureUser(users, Role.SHOP_OWNER, "priya@salon.com", null, () -> new User(
                    null, Role.SHOP_OWNER, "Priya Sharma", "priya@salon.com",
                    hasher.hash("secret123"), "9000000002", null, null));

            Shop shop = ensureShop(shops, DEMO_SHOP_ID, () -> new Shop(
                    DEMO_SHOP_ID, owner.id(), "Downtown Cuts", ShopType.SALON,
                    "+10000000000", "9000000011", "221B Baker Street, Pune", null,
                    ShopStatus.OPEN, null, null, null, null));

            Shop uptown = ensureShop(shops, SECOND_SHOP_ID, () -> new Shop(
                    SECOND_SHOP_ID, secondOwner.id(), "Uptown Salon", ShopType.SALON,
                    "+10000000001", "9000000012", "12 MG Road, Pune", null,
                    ShopStatus.OPEN, null, null, null, null));

            // Left NEW on purpose: the "registered but not yet open" state is easy to
            // forget exists, and it must stay hidden from the customer-facing shop list.
            ensureShop(shops, NEW_SHOP_ID, () -> new Shop(
                    NEW_SHOP_ID, owner.id(), "Riverside Barbers (not open yet)", ShopType.SALON,
                    null, null, "5 River Lane, Pune", null,
                    ShopStatus.NEW, null, null, null, null));

            if (owner.shopId() == null) {
                users.save(new User(
                        owner.id(), owner.role(), owner.name(), owner.email(),
                        owner.passwordHash(), owner.phone(), owner.pinHash(), shop.id(),
                        owner.active(), owner.onDuty()));
            }

            // Two barbers so multi-chair queueing has something to demonstrate — the
            // first is seeded on duty (and is who seedQueue() puts in the chair), the
            // second starts off duty so "go on duty" has a visible effect.
            User barber = ensureUser(users, Role.BARBER_STAFF, null, "9876543210", () -> new User(
                    null, Role.BARBER_STAFF, "Barber", null, null,
                    "9876543210", hasher.hash("1234"), shop.id()));
            if (!barber.onDuty()) {
                barber = users.save(barber.onDutyOn());
            }
            ensureUser(users, Role.BARBER_STAFF, null, "9876543211", () -> new User(
                    null, Role.BARBER_STAFF, "Second Barber", null, null,
                    "9876543211", hasher.hash("1234"), shop.id()));

            seedServices(shopServices, catalog, shop.id(), List.of(
                    service("HAIRCUT", 250, 20),
                    service("BEARD", 150, 10),
                    service("SHAVE", 120, 15),
                    service("HAIR_COLOR", 900, 45),
                    service("KIDS_HAIRCUT", 180, 15)));

            seedServices(shopServices, catalog, uptown.id(), List.of(
                    service("HAIRCUT", 400, 25),
                    service("FACIAL", 700, 40),
                    service("HAIR_SPA", 1200, 50)));

            seedQueue(queueEntries, shop.id(), barber.id());

            log.info("Seeded demo data — shops: {}, {}, {} (NEW)",
                    shop.name(), uptown.name(), "Riverside Barbers");
            log.info("  Accounts: admin@smartqueue.app (ADMIN), owner@shop.com + priya@salon.com "
                    + "(SHOP_OWNER), 9876543210 + 9876543211 (BARBER_STAFF) — see README for sign-in details");
            log.info("  Admin id {} is available for shop reassignment demos", admin.id());
        };
    }

    /**
     * A queue with one customer already in the chair and five waiting, so wait
     * estimates, "N ahead of you" and the WhatsApp status flow all have real data
     * to answer with. Skipped entirely once the shop has any entry — re-seeding a
     * live queue would collide on the per-shop unique token.
     */
    private static void seedQueue(QueueEntryRepository queueEntries, String shopId, String onDutyBarberId) {
        if (queueEntries.highestToken(shopId).isPresent()) {
            return;
        }
        List<String[]> customers = List.of(
                new String[] {"Rahul Verma", "919000000101"},
                new String[] {"Anita Desai", "919000000102"},
                new String[] {"Sam Patel", "919000000103"},
                new String[] {"Neha Gupta", "919000000104"},
                new String[] {"Arjun Rao", "919000000105"},
                new String[] {"Vikram Singh", "919000000106"});
        ServiceType[] services = {
            ServiceType.HAIRCUT, ServiceType.BEARD, ServiceType.HAIRCUT_BEARD,
            ServiceType.HAIRCUT, ServiceType.BEARD, ServiceType.HAIRCUT,
        };

        for (int i = 0; i < customers.size(); i++) {
            String[] customer = customers.get(i);
            QueueEntry entry = QueueEntry.joining(
                    shopId, i + 1, i + 1, services[i], customer[1], customer[0]);
            // The first customer is already being served; the rest are the waiting line.
            queueEntries.save(i == 0 ? entry.claimedBy(onDutyBarberId) : entry);
        }
    }

    /**
     * Codes are resolved against service_catalog rather than trusted blindly, so a seed
     * referring to a service that is not in the catalog fails loudly instead of leaving
     * a dangling row for the FK to reject.
     */
    private static void seedServices(
            ShopServiceRepository shopServices,
            ServiceCatalogRepository catalog,
            String shopId,
            List<SeedService> services) {
        for (SeedService seed : services) {
            if (shopServices.existsByShopIdAndService(shopId, seed.code())) {
                continue;
            }
            CatalogService service = catalog.findByCode(seed.code())
                    .orElseThrow(() -> new IllegalStateException(
                            "Demo seed references unknown service code: " + seed.code()));
            shopServices.save(ShopService.adding(
                    shopId, service, seed.price(), seed.estimatedMinutes()));
        }
    }

    private record SeedService(String code, Integer price, int estimatedMinutes) {
    }

    private static SeedService service(String code, Integer price, int estimatedMinutes) {
        return new SeedService(code, price, estimatedMinutes);
    }

    private static Shop ensureShop(ShopRepository shops, String shopId, Supplier<Shop> factory) {
        return shops.findById(shopId).orElseGet(() -> shops.save(factory.get()));
    }

    /** Returns the existing user for this role/identifier, or the freshly-saved one. */
    private static User ensureUser(
            UserRepository users, Role role, String email, String phone, Supplier<User> factory) {
        return (email != null
                        ? users.findByEmailAndRole(email, role)
                        : users.findByPhoneAndRole(phone, role))
                .orElseGet(() -> users.save(factory.get()));
    }
}
