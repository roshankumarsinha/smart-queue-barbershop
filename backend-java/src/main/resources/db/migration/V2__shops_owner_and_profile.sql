-- Smart Queue — shop ownership + richer shop profile.
--
-- Two changes land together here:
--   1. Ownership moves onto the shop. V1 only linked a user to a shop via
--      users.shop_id (one user, one shop). To let a SHOP_OWNER hold *many*
--      shops, the owning user is now referenced from the shop itself.
--   2. Smart Queue is no longer barbershop-only, so a shop carries a `type`
--      (salon / restaurant / hospital / …) plus contact + location + hours.
--
-- Enum-like `type` follows the V1 convention: VARCHAR + CHECK, not a native
-- Postgres enum — the allowed values are owned by com.smartqueue.domain.ShopType,
-- and widening a CHECK is a cheaper migration than ALTER TYPE.

ALTER TABLE shops
    ADD COLUMN owner_id     VARCHAR(64) REFERENCES users (id),
    ADD COLUMN type         VARCHAR(32)  NOT NULL DEFAULT 'SALON',
    ADD COLUMN phone        VARCHAR(32),   -- the shop's own contact line, distinct from whatsapp_number
    ADD COLUMN location_url VARCHAR(500),  -- a Google Maps share link, opened on click (no Maps API)
    ADD COLUMN opening_time TIME,          -- nullable: hours may be unknown at onboarding
    ADD COLUMN closing_time TIME;

ALTER TABLE shops
    ADD CONSTRAINT chk_shops_type
        CHECK (type IN ('SALON', 'RESTAURANT', 'HOSPITAL', 'CLINIC', 'GOVERNMENT', 'RETAIL', 'OTHER'));

-- "Which shops does this owner run?" is the hot query on the admin drill-down.
CREATE INDEX idx_shops_owner ON shops (owner_id);
