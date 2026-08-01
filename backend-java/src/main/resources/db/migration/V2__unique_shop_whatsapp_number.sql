-- A WhatsApp number is how customers reach a shop, so two shops must never share one.
--
-- Partial rather than a plain UNIQUE constraint: a shop can be onboarded before its
-- number is known, and the predicate makes "many NULLs are fine" explicit instead of
-- leaving it to Postgres' NULL-distinctness rule. ShopService normalises blank input
-- to NULL so empty strings never collide here.
CREATE UNIQUE INDEX uq_shops_whatsapp_number
    ON shops (whatsapp_number)
    WHERE whatsapp_number IS NOT NULL;
