-- =============================================================================
-- MIGRATION: Create viewing_requests table
-- Run this once in the Supabase SQL Editor to fix the PGRST205 error.
-- =============================================================================

CREATE TABLE IF NOT EXISTS viewing_requests (
    id              SERIAL PRIMARY KEY,
    student_id      INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    landlord_id     INT          NULL REFERENCES users(user_id) ON DELETE SET NULL,
    hostel_id       INT          NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    student_name    VARCHAR(150),
    student_phone   VARCHAR(30),
    preferred_date  DATE         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for fast student lookups
CREATE INDEX IF NOT EXISTS idx_viewing_requests_student_id  ON viewing_requests(student_id);
-- Index for fast landlord lookups
CREATE INDEX IF NOT EXISTS idx_viewing_requests_landlord_id ON viewing_requests(landlord_id);
-- Index for fast property lookups
CREATE INDEX IF NOT EXISTS idx_viewing_requests_hostel_id   ON viewing_requests(hostel_id);
