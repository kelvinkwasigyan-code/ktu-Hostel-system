-- =============================================================================
-- Migration: Database-Level Audit Logging Triggers
-- Description: Automatically logs INSERT, UPDATE, and DELETE mutations across core entities
-- =============================================================================

-- 1. Create audit_logs table if it does not exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,            -- e.g., 'INSERT', 'UPDATE', 'DELETE', 'ROLE_CHANGED'
    target_resource VARCHAR(100) NOT NULL,   -- e.g., 'users', 'properties', 'bookings', 'reviews'
    target_id VARCHAR(255),                  -- Primary key value of target entity
    details JSONB,                           -- Structured diff/metadata: { old_data, new_data }
    ip_address VARCHAR(45),                  -- Client IP address
    user_agent TEXT,                         -- Browser / Device user agent
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
);

-- Create performance indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(target_resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. Audit trigger function
CREATE OR REPLACE FUNCTION fn_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_target_id VARCHAR(255);
    v_details JSONB;
BEGIN
    -- Extract target_id based on table primary key
    IF (TG_OP = 'DELETE') THEN
        v_target_id := COALESCE(
            (to_jsonb(OLD)->>'id'),
            (to_jsonb(OLD)->>'user_id'),
            (to_jsonb(OLD)->>'property_id'),
            (to_jsonb(OLD)->>'booking_id'),
            (to_jsonb(OLD)->>'review_id'),
            (to_jsonb(OLD)->>'image_id'),
            (to_jsonb(OLD)->>'alert_id'),
            NULL
        );
        v_details := jsonb_build_object('old_data', to_jsonb(OLD));
    ELSIF (TG_OP = 'UPDATE') THEN
        v_target_id := COALESCE(
            (to_jsonb(NEW)->>'id'),
            (to_jsonb(NEW)->>'user_id'),
            (to_jsonb(NEW)->>'property_id'),
            (to_jsonb(NEW)->>'booking_id'),
            (to_jsonb(NEW)->>'review_id'),
            (to_jsonb(NEW)->>'image_id'),
            (to_jsonb(NEW)->>'alert_id'),
            NULL
        );
        v_details := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
    ELSE -- INSERT
        v_target_id := COALESCE(
            (to_jsonb(NEW)->>'id'),
            (to_jsonb(NEW)->>'user_id'),
            (to_jsonb(NEW)->>'property_id'),
            (to_jsonb(NEW)->>'booking_id'),
            (to_jsonb(NEW)->>'review_id'),
            (to_jsonb(NEW)->>'image_id'),
            (to_jsonb(NEW)->>'alert_id'),
            NULL
        );
        v_details := jsonb_build_object('new_data', to_jsonb(NEW));
    END IF;

    -- Retrieve current authenticated Supabase user ID if available
    BEGIN
        v_user_id := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- Fallback: extract user ID directly from table record if present
    IF v_user_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN
            v_user_id := nullif(COALESCE(to_jsonb(OLD)->>'user_id', to_jsonb(OLD)->>'student_id', to_jsonb(OLD)->>'landlord_id', ''), '')::uuid;
        ELSE
            v_user_id := nullif(COALESCE(to_jsonb(NEW)->>'user_id', to_jsonb(NEW)->>'student_id', to_jsonb(NEW)->>'landlord_id', ''), '')::uuid;
        END IF;
    END IF;

    -- Insert audit record
    INSERT INTO audit_logs (
        id,
        user_id,
        action,
        target_resource,
        target_id,
        details,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        v_target_id,
        v_details,
        NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers for core entities

-- Table: users
DROP TRIGGER IF EXISTS trg_audit_users ON users;
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Table: properties
DROP TRIGGER IF EXISTS trg_audit_properties ON properties;
CREATE TRIGGER trg_audit_properties
AFTER INSERT OR UPDATE OR DELETE ON properties
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Table: bookings
DROP TRIGGER IF EXISTS trg_audit_bookings ON bookings;
CREATE TRIGGER trg_audit_bookings
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Table: reviews
DROP TRIGGER IF EXISTS trg_audit_reviews ON reviews;
CREATE TRIGGER trg_audit_reviews
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Table: property_images
DROP TRIGGER IF EXISTS trg_audit_property_images ON property_images;
CREATE TRIGGER trg_audit_property_images
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Table: vacancy_alerts
DROP TRIGGER IF EXISTS trg_audit_vacancy_alerts ON vacancy_alerts;
CREATE TRIGGER trg_audit_vacancy_alerts
AFTER INSERT OR UPDATE OR DELETE ON vacancy_alerts
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
