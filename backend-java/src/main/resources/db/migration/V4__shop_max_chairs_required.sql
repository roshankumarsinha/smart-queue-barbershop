-- max_chairs becomes a required field — every shop has a real, known chair count.
-- Anything registered before this was required (max_chairs left null) is backfilled to
-- 1; an owner should correct it to the shop's actual count via PATCH /shops/{id}.

UPDATE shops SET max_chairs = 1 WHERE max_chairs IS NULL;

ALTER TABLE shops ALTER COLUMN max_chairs SET NOT NULL;
ALTER TABLE shops ALTER COLUMN max_chairs SET DEFAULT 1;

-- Superseded by the NOT NULL constraint above — the "IS NULL OR" half is now vacuous.
ALTER TABLE shops DROP CONSTRAINT chk_shops_max_chairs;
ALTER TABLE shops ADD CONSTRAINT chk_shops_max_chairs CHECK (max_chairs >= 1);
