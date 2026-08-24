-- Multi-chair queueing: a barber can go on/off duty, and each on-duty barber
-- is one concurrent "chair". queue_entries.served_by attributes an entry to
-- whichever barber claimed it.

ALTER TABLE users ADD COLUMN on_duty BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE queue_entries ADD COLUMN served_by VARCHAR(64) REFERENCES users (id);

-- Covers "who is this barber currently serving" (off-duty guard, advance()).
CREATE INDEX idx_queue_entries_served_by ON queue_entries (served_by)
    WHERE served_by IS NOT NULL;
