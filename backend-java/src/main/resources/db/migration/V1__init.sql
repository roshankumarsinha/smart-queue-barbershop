-- Smart Queue — initial schema.
--
-- Enum-like columns are stored as VARCHAR with a CHECK constraint rather than native
-- Postgres enums: the allowed values are owned by the Java enums in
-- com.smartqueue.domain, and widening a CHECK is a cheaper migration than ALTER TYPE.
--
-- shops and users reference each other (a shop has an owner; a barber belongs to a
-- shop), so both tables are created first and the foreign keys added afterwards.

CREATE TABLE shops (
    id              VARCHAR(64) PRIMARY KEY,
    owner_id        VARCHAR(64),                            -- FK added below
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(32)  NOT NULL DEFAULT 'SALON',
    whatsapp_number VARCHAR(32),
    phone           VARCHAR(32),                            -- the shop's own line, distinct from whatsapp_number
    address         VARCHAR(500),
    location_url    VARCHAR(500),                           -- a Google Maps share link, opened on click (no Maps API)
    -- NEW (registered, not yet taking customers) -> OPEN -> CLOSED.
    status          VARCHAR(32)  NOT NULL DEFAULT 'NEW',
    opening_time    TIME,                                   -- nullable: hours may be unknown at onboarding
    closing_time    TIME,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_shops_type
        CHECK (type IN ('SALON', 'RESTAURANT', 'HOSPITAL', 'CLINIC', 'GOVERNMENT', 'RETAIL', 'OTHER')),
    CONSTRAINT chk_shops_status
        CHECK (status IN ('NEW', 'OPEN', 'CLOSED'))
);

CREATE TABLE users (
    id            VARCHAR(64) PRIMARY KEY,
    role          VARCHAR(32)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    -- Owners & admins sign in with email + password.
    email         VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    -- Barbers sign in with phone + PIN.
    phone         VARCHAR(32)  UNIQUE,
    pin_hash      VARCHAR(255),
    shop_id       VARCHAR(64),                              -- FK added below
    -- Accounts are deactivated, never deleted: shops and queue history hang off
    -- users.id and stay meaningful after someone leaves the platform.
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_role
        CHECK (role IN ('SHOP_OWNER', 'BARBER_STAFF', 'ADMIN', 'CUSTOMER'))
);

ALTER TABLE shops
    ADD CONSTRAINT fk_shops_owner FOREIGN KEY (owner_id) REFERENCES users (id);

ALTER TABLE users
    ADD CONSTRAINT fk_users_shop FOREIGN KEY (shop_id) REFERENCES shops (id);

-- A WhatsApp number is how customers reach a shop, so two shops must never share one.
-- Partial rather than a plain UNIQUE constraint: a shop can be onboarded before its
-- number is known, so many NULLs must stay fine.
CREATE UNIQUE INDEX uq_shops_whatsapp_number
    ON shops (whatsapp_number)
    WHERE whatsapp_number IS NOT NULL;

-- "Which shops does this owner run?" is the hot query on the admin drill-down.
CREATE INDEX idx_shops_owner ON shops (owner_id);

-- The catalog of services that can be offered, scoped by shop type. This is data
-- rather than a Java enum so a new service ("Hair Botox") can be added without a
-- deploy. sort_order drives the "add service" dropdown; retiring a service means
-- setting active = FALSE, never deleting — shop_services rows still reference it.
CREATE TABLE service_catalog (
    code       VARCHAR(64) PRIMARY KEY,
    shop_type  VARCHAR(32)  NOT NULL,
    label      VARCHAR(255) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_service_catalog_shop_type
        CHECK (shop_type IN ('SALON', 'RESTAURANT', 'HOSPITAL', 'CLINIC', 'GOVERNMENT', 'RETAIL', 'OTHER'))
);

CREATE INDEX idx_service_catalog_shop_type ON service_catalog (shop_type, sort_order);

-- The starting catalog. Other verticals plug in by inserting rows with their own
-- shop_type; nothing in the services layer needs to change.
INSERT INTO service_catalog (code, shop_type, label, sort_order) VALUES
    ('HAIRCUT',      'SALON', 'Haircut',        10),
    ('BEARD',        'SALON', 'Beard grooming', 20),
    ('SHAVE',        'SALON', 'Shave',          30),
    ('FACIAL',       'SALON', 'Facial',         40),
    ('DETAN',        'SALON', 'De-tan',         50),
    ('HAIR_COLOR',   'SALON', 'Hair colour',    60),
    ('HEAD_MASSAGE', 'SALON', 'Head massage',   70),
    ('HAIR_SPA',     'SALON', 'Hair spa',       80),
    ('HAIR_WASH',    'SALON', 'Hair wash',      90),
    ('KIDS_HAIRCUT', 'SALON', 'Kids haircut',  100);

-- Each row is one service a shop provides, chosen from service_catalog above.
CREATE TABLE shop_services (
    id                VARCHAR(64) PRIMARY KEY,
    shop_id           VARCHAR(64)  NOT NULL REFERENCES shops (id),
    service_code      VARCHAR(64)  NOT NULL REFERENCES service_catalog (code),
    price             INTEGER,                              -- INR, whole rupees; NULL = not priced
    estimated_minutes INTEGER      NOT NULL,                -- drives queue wait estimates
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_shop_services_estimated_minutes CHECK (estimated_minutes >= 1),
    CONSTRAINT chk_shop_services_price CHECK (price IS NULL OR price >= 0)
);

-- A shop can offer each service type at most once.
CREATE UNIQUE INDEX uq_shop_services_shop_code ON shop_services (shop_id, service_code);

-- Covers the hot path: "which services does this shop offer?".
CREATE INDEX idx_shop_services_shop ON shop_services (shop_id);

CREATE TABLE queue_entries (
    id             VARCHAR(64) PRIMARY KEY,
    shop_id        VARCHAR(64)  NOT NULL REFERENCES shops (id),
    token          INTEGER      NOT NULL,                   -- human-facing number, never reused
    customer_name  VARCHAR(255),
    phone          VARCHAR(32),
    service        VARCHAR(32)  NOT NULL,
    status         VARCHAR(32)  NOT NULL DEFAULT 'WAITING',
    queue_position INTEGER      NOT NULL,                   -- ordering key; POSITION is SQL-reserved
    joined_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_queue_entries_service
        CHECK (service IN ('HAIRCUT', 'BEARD', 'HAIRCUT_BEARD')),
    CONSTRAINT chk_queue_entries_status
        CHECK (status IN ('WAITING', 'IN_SERVICE', 'DONE', 'SKIPPED', 'NO_SHOW', 'LEFT'))
);

-- Tokens are unique per shop, not globally.
CREATE UNIQUE INDEX uq_queue_entries_shop_token ON queue_entries (shop_id, token);

-- Covers the hot path: "who is waiting / in service at this shop".
CREATE INDEX idx_queue_entries_shop_status ON queue_entries (shop_id, status);

CREATE TABLE notifications (
    id             VARCHAR(64) PRIMARY KEY,
    queue_entry_id VARCHAR(64) NOT NULL REFERENCES queue_entries (id),
    type           VARCHAR(32) NOT NULL,
    channel        VARCHAR(32) NOT NULL DEFAULT 'whatsapp',
    sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notifications_type
        CHECK (type IN ('JOINED', 'ALMOST_YOUR_TURN', 'YOUR_TURN', 'REMOVED'))
);

CREATE INDEX idx_notifications_queue_entry ON notifications (queue_entry_id);
