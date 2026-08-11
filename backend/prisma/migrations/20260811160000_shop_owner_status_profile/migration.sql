-- Shop ownership + richer profile + lifecycle status, mirroring the Java backend
-- (V2 owner/profile + V3 status/drop-service-time).
--
--   * Shop gains ownerId (FK -> User), type, phone, locationUrl, opening/closing time.
--   * `active` boolean becomes a three-state `status` (NEW/OPEN/CLOSED). Existing
--     shops carry over active -> OPEN, inactive -> CLOSED.
--   * avgServiceTime is dropped; wait estimates now use a fixed default in code.
--
-- SQLite can't drop/alter columns in place, so this is the standard table rebuild.

PRAGMA defer_foreign_keys = ON;
PRAGMA foreign_keys = OFF;

CREATE TABLE "new_Shop" (
    "id"             TEXT NOT NULL PRIMARY KEY,
    "name"           TEXT NOT NULL,
    "ownerId"        TEXT,
    "type"           TEXT NOT NULL DEFAULT 'SALON',
    "whatsappNumber" TEXT,
    "phone"          TEXT,
    "address"        TEXT,
    "locationUrl"    TEXT,
    "openingTime"    TEXT,
    "closingTime"    TEXT,
    "status"         TEXT NOT NULL DEFAULT 'NEW',
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      DATETIME NOT NULL,
    CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Shop" ("id", "name", "whatsappNumber", "address", "createdAt", "updatedAt", "type", "status")
SELECT
    "id",
    "name",
    "whatsappNumber",
    "address",
    "createdAt",
    "updatedAt",
    'SALON',
    CASE WHEN "active" = 1 THEN 'OPEN' ELSE 'CLOSED' END
FROM "Shop";

-- Backfill ownership from the existing staff link: a shop's owner is the SHOP_OWNER
-- whose default shop is this one.
UPDATE "new_Shop"
SET "ownerId" = (
    SELECT "u"."id" FROM "User" "u"
    WHERE "u"."role" = 'SHOP_OWNER' AND "u"."shopId" = "new_Shop"."id"
    LIMIT 1
);

DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_whatsappNumber_key" ON "Shop"("whatsappNumber");

PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = OFF;
