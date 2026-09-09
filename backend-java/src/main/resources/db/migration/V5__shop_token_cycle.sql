-- A "token cycle" lets queue tokens restart at 1 each time a shop closes, without
-- violating token uniqueness: the old all-time unique index is replaced by one scoped
-- to (shop, cycle), and each entry records which cycle it was issued in.

ALTER TABLE shops ADD COLUMN token_cycle INTEGER NOT NULL DEFAULT 1;
ALTER TABLE queue_entries ADD COLUMN token_cycle INTEGER NOT NULL DEFAULT 1;

DROP INDEX uq_queue_entries_shop_token;
CREATE UNIQUE INDEX uq_queue_entries_shop_token_cycle ON queue_entries (shop_id, token, token_cycle);

-- Covers the hot path: "what's the highest token issued in the shop's current cycle".
CREATE INDEX idx_queue_entries_shop_cycle ON queue_entries (shop_id, token_cycle);
