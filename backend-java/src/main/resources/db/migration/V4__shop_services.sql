-- Smart Queue — services a shop offers.
--
-- Each row is one service a shop provides, chosen from a per-shop-type catalog
-- (com.smartqueue.domain.CatalogService — e.g. SALON: HAIRCUT, BEARD, FACIAL, …).
-- A service type can be added to a shop only once. `estimated_minutes` will drive
-- queue wait estimates once the join flow lets a customer pick a service; `price`
-- is optional (INR, whole rupees).
--
-- Unlike the enum-like columns elsewhere, `service_code` has no CHECK constraint:
-- the allowed codes span shop types and grow over time, and are owned by the Java
-- CatalogService enum — a CHECK would have to be widened on every new service.

CREATE TABLE shop_services (
    id                VARCHAR(64) PRIMARY KEY,
    shop_id           VARCHAR(64)  NOT NULL REFERENCES shops (id),
    service_code      VARCHAR(64)  NOT NULL,
    price             INTEGER,               -- INR, whole rupees; NULL = not priced
    estimated_minutes INTEGER      NOT NULL, -- drives queue wait estimates
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_shop_services_estimated_minutes CHECK (estimated_minutes >= 1),
    CONSTRAINT chk_shop_services_price CHECK (price IS NULL OR price >= 0)
);

-- A shop can offer each service type at most once.
CREATE UNIQUE INDEX uq_shop_services_shop_code ON shop_services (shop_id, service_code);

-- Covers the hot path: "which services does this shop offer?".
CREATE INDEX idx_shop_services_shop ON shop_services (shop_id);
