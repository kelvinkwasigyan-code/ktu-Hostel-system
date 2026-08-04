-- =============================================================================
-- KTU Student Hostel Portal — Database Schema (PostgreSQL / Supabase)
-- Implements exactly the 6-table design from Chapter 3 of the project brief.
-- =============================================================================

-- Enable UUID extension (useful for Supabase Auth linkage)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: users
-- Stores all platform actors: Students, Landlords, Admins
-- UC-S01 (Student Register), UC-L01 (Landlord Register), UC-A01 (Admin Verify)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('Student', 'Landlord', 'Admin')),
    -- verification_status only meaningful for Landlords
    verification_status VARCHAR(20) DEFAULT 'Approved'
                        CHECK (verification_status IN ('Pending', 'Approved', 'Rejected')),
    id_document_path    VARCHAR(255) NULL,   -- landlord identity document path (Supabase Storage)
    profile_picture     TEXT NULL,           -- profile avatar photo URL or base64
    bio                 TEXT NULL,           -- landlord biography / intro
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: properties
-- Off-campus housing listings created by verified Landlords.
-- UC-L02 (Create Listing), UC-S03 (Search), UC-S04 (View Detail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS properties (
    property_id              SERIAL PRIMARY KEY,
    landlord_id              INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title                    VARCHAR(150) NOT NULL,
    address                  VARCHAR(255) NOT NULL,
    latitude                 DECIMAL(10, 7) NOT NULL,
    longitude                DECIMAL(10, 7) NOT NULL,
    description              TEXT,
    price_per_semester       DECIMAL(10, 2) NOT NULL,
    room_type                VARCHAR(30) NOT NULL
                             CHECK (room_type IN ('Single', 'Shared', 'Self-contained', 'Apartment')),
    max_occupancy            INT NOT NULL DEFAULT 1,
    amenities                TEXT,         -- stored as JSON string (parsed in app layer)
    neighborhood             VARCHAR(100),
    distance_from_campus_km  DECIMAL(5, 2),  -- cached via Distance Matrix API on creation (UC-L02)
    rooms_available          INT DEFAULT 5,
    gender_policy            VARCHAR(20) DEFAULT 'Mixed'
                             CHECK (gender_policy IN ('Mixed', 'Boys only', 'Girls only')),
    availability_status      VARCHAR(20) DEFAULT 'Available'
                             CHECK (availability_status IN ('Available', 'Pending', 'Occupied')),
    verification_status      VARCHAR(20) DEFAULT 'Pending'
                             CHECK (verification_status IN ('Pending', 'Approved', 'Rejected')),
    created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Performance index for student search filters (UC-S03)
CREATE INDEX IF NOT EXISTS idx_properties_search
    ON properties (neighborhood, price_per_semester, room_type, availability_status, verification_status);

-- =============================================================================
-- TABLE: property_images
-- Up to 5 photos per listing. Enforced in application layer.
-- UC-L02 (photo upload)
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_images (
    image_id      SERIAL PRIMARY KEY,
    property_id   INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    image_path    TEXT NOT NULL,            -- Supabase Storage URL or base64 data URL
    display_order SMALLINT DEFAULT 0        -- 0 = primary/hero image
);

-- =============================================================================
-- TABLE: bookings
-- 24-hour non-transactional reservation holds. (UC-S06, UC-L04)
--
-- Business rules (enforced in application layer):
--   1. A student may have only ONE active ('Pending') hold at a time.
--   2. A property may have only ONE active ('Pending') hold at a time.
--   3. expires_at = created_at + 24 hours (set on INSERT).
-- =============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id         SERIAL PRIMARY KEY,
    student_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    property_id        INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    selected_room_type VARCHAR(50) NULL,
    agreed_price       DECIMAL(10, 2) NULL,
    status             VARCHAR(20) DEFAULT 'Pending'
                       CHECK (status IN ('Pending', 'Approved', 'Declined', 'Expired', 'Cancelled')),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    expires_at         TIMESTAMPTZ NULL,       -- set to created_at + INTERVAL '24 hours' on insert
    resolved_at        TIMESTAMPTZ NULL
);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_rates TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_room_type VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agreed_price DECIMAL(10, 2);
-- Widen image_path to TEXT (handles both Supabase Storage URLs and base64 data URLs)
ALTER TABLE property_images ALTER COLUMN image_path TYPE TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_contact_info TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- =============================================================================
-- TABLE: reviews
-- Booking-gated peer reviews — only students with Approved bookings may review.
-- UC-S07 (Submit Review), UC-A03 (Moderate Reviews)
--
-- Hard integrity rule: a review may only be inserted if the corresponding
-- booking has status = 'Approved'. Enforced server-side in ReviewController.
-- =============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    review_id   SERIAL PRIMARY KEY,
    student_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    booking_id  INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    is_flagged  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, booking_id)   -- one review per booking
);

-- =============================================================================
-- TABLE: notifications
-- In-app notification center. Real-time via Supabase Realtime.
-- UC-S08 (Vacancy Alerts), UC-L04 (Booking responses), UC-A01 (Verification)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id     SERIAL PRIMARY KEY,
    recipient_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL
                        CHECK (type IN ('BookingRequest', 'BookingAccepted', 'BookingDeclined',
                                        'VacancyAlert', 'VerificationResult', 'System')),
    message             VARCHAR(255) NOT NULL,
    related_property_id INT NULL,
    related_booking_id  INT NULL,
    is_read             BOOLEAN DEFAULT FALSE,
    delivery_channel    VARCHAR(10) DEFAULT 'InApp'
                        CHECK (delivery_channel IN ('InApp', 'SMS', 'Both')),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast unread-count queries (notification badge polling)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications (recipient_id, is_read);

-- =============================================================================
-- TABLE: vacancy_alerts
-- Students opt-in to alerts for saved search criteria. (UC-S08)
-- =============================================================================
CREATE TABLE IF NOT EXISTS vacancy_alerts (
    alert_id       SERIAL PRIMARY KEY,
    student_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    neighborhood   VARCHAR(100),
    max_price      DECIMAL(10, 2),
    room_type      VARCHAR(30),
    max_distance   DECIMAL(5, 2),
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS gender_policy VARCHAR(20) DEFAULT 'Mixed';

-- =============================================================================
-- TABLE: audit_logs
-- Audit trail logging for administrative, authorization, and sensitive operations.
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,            -- e.g., 'RESERVATION_CANCELLED', 'ROLE_CHANGED'
    target_resource VARCHAR(100) NOT NULL,   -- e.g., 'reservations', 'users'
    target_id VARCHAR(255),                  -- ID of the modified record
    details JSONB,                           -- Additional contextual metadata
    ip_address VARCHAR(45),                  -- Client IP address
    user_agent TEXT,                         -- Browser / Device details
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
);

-- Index for fast searching by user, resource, action, or date
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(target_resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- DATABASE-LEVEL AUDIT LOGGING TRIGGERS
-- Automatic mutation tracking for users, properties, bookings, reviews, images
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_target_id VARCHAR(255);
    v_details JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_target_id := COALESCE((to_jsonb(OLD)->>'id'), (to_jsonb(OLD)->>'user_id'), (to_jsonb(OLD)->>'property_id'), (to_jsonb(OLD)->>'booking_id'), (to_jsonb(OLD)->>'review_id'), (to_jsonb(OLD)->>'image_id'), (to_jsonb(OLD)->>'alert_id'), NULL);
        v_details := jsonb_build_object('old_data', to_jsonb(OLD));
    ELSIF (TG_OP = 'UPDATE') THEN
        v_target_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(NEW)->>'user_id'), (to_jsonb(NEW)->>'property_id'), (to_jsonb(NEW)->>'booking_id'), (to_jsonb(NEW)->>'review_id'), (to_jsonb(NEW)->>'image_id'), (to_jsonb(NEW)->>'alert_id'), NULL);
        v_details := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
    ELSE
        v_target_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(NEW)->>'user_id'), (to_jsonb(NEW)->>'property_id'), (to_jsonb(NEW)->>'booking_id'), (to_jsonb(NEW)->>'review_id'), (to_jsonb(NEW)->>'image_id'), (to_jsonb(NEW)->>'alert_id'), NULL);
        v_details := jsonb_build_object('new_data', to_jsonb(NEW));
    END IF;

    BEGIN
        v_user_id := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN
            v_user_id := nullif(COALESCE(to_jsonb(OLD)->>'user_id', to_jsonb(OLD)->>'student_id', to_jsonb(OLD)->>'landlord_id', ''), '')::uuid;
        ELSE
            v_user_id := nullif(COALESCE(to_jsonb(NEW)->>'user_id', to_jsonb(NEW)->>'student_id', to_jsonb(NEW)->>'landlord_id', ''), '')::uuid;
        END IF;
    END IF;

    INSERT INTO audit_logs (id, user_id, action, target_resource, target_id, details, created_at)
    VALUES (gen_random_uuid(), v_user_id, TG_OP, TG_TABLE_NAME, v_target_id, v_details, NOW());

    IF (TG_OP = 'DELETE') THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
CREATE TRIGGER trg_audit_properties AFTER INSERT OR UPDATE OR DELETE ON properties FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
CREATE TRIGGER trg_audit_bookings AFTER INSERT OR UPDATE OR DELETE ON bookings FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
CREATE TRIGGER trg_audit_reviews AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
CREATE TRIGGER trg_audit_property_images AFTER INSERT OR UPDATE OR DELETE ON property_images FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
CREATE TRIGGER trg_audit_vacancy_alerts AFTER INSERT OR UPDATE OR DELETE ON vacancy_alerts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();


-- =============================================================================
-- TABLE: viewing_requests
-- Student requests to visit / inspect a property before booking.
-- =============================================================================
CREATE TABLE IF NOT EXISTS viewing_requests (
    id              SERIAL PRIMARY KEY,
    student_id      INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    landlord_id     INT          NULL     REFERENCES users(user_id) ON DELETE SET NULL,
    hostel_id       INT          NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    student_name    VARCHAR(150),
    student_phone   VARCHAR(30),
    preferred_date  DATE         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viewing_requests_student_id  ON viewing_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_landlord_id ON viewing_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_hostel_id   ON viewing_requests(hostel_id);



