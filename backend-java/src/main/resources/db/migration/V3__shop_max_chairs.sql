-- How many physical chairs a shop actually has, independent of how many barbers are
-- registered or on duty. Wait-time math caps the effective chair count at this value
-- (see Shop#effectiveChairCount) — null means "no cap configured", i.e. today's
-- behavior (chair count = active barber headcount, unbounded).

ALTER TABLE shops ADD COLUMN max_chairs INTEGER;

ALTER TABLE shops
    ADD CONSTRAINT chk_shops_max_chairs CHECK (max_chairs IS NULL OR max_chairs >= 1);
