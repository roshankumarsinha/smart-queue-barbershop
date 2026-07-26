-- Smart Queue — initial schema.
--
-- Mirrors backend/prisma/schema.prisma. Enum-like columns are stored as VARCHAR
-- with a CHECK constraint rather than native Postgres enums: the allowed values
-- are owned by the Java enums in com.smartqueue.domain, and adding a value to a
-- CHECK is a cheaper migration than ALTER TYPE.

CREATE TABLE shops (
    id               VARCHAR(64) PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    whatsapp_number  VARCHAR(32),
    avg_service_time INTEGER      NOT NULL DEFAULT 20, -- minutes, drives wait estimates
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
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
    shop_id       VARCHAR(64)  REFERENCES shops (id),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_role
        CHECK (role IN ('SHOP_OWNER', 'BARBER_STAFF', 'SUPER_ADMIN', 'CUSTOMER'))
);

CREATE TABLE queue_entries (
    id             VARCHAR(64) PRIMARY KEY,
    shop_id        VARCHAR(64)  NOT NULL REFERENCES shops (id),
    token          INTEGER      NOT NULL, -- human-facing number, never reused
    customer_name  VARCHAR(255),
    phone          VARCHAR(32),
    service        VARCHAR(32)  NOT NULL,
    status         VARCHAR(32)  NOT NULL DEFAULT 'WAITING',
    queue_position INTEGER      NOT NULL, -- ordering key; POSITION is SQL-reserved
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
