-- Smart Queue — shop lifecycle status + drop per-shop service time.
--
--   1. avg_service_time leaves the shop. Wait estimates now use a fixed default in
--      the domain; per-service estimated times will arrive with the planned
--      "register service" flow and be computed from there instead.
--   2. A shop gains a three-state lifecycle: NEW (just registered, not yet taking
--      customers), OPEN (taking customers), CLOSED. This replaces the `active`
--      boolean — NEW is the state a freshly registered shop starts in.

ALTER TABLE shops DROP COLUMN avg_service_time;

ALTER TABLE shops
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'OPEN', 'CLOSED'));

-- Carry existing shops over: active -> OPEN, inactive -> CLOSED.
UPDATE shops SET status = CASE WHEN active THEN 'OPEN' ELSE 'CLOSED' END;

ALTER TABLE shops DROP COLUMN active;
