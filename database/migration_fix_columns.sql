-- =============================================================================
-- Migration: Fix columns for multi-room listings and image storage
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- 1. Add room_rates column to properties table (stores multi-room pricing as JSON)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_rates TEXT;

-- 2. Add selected_room_type and agreed_price to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_room_type VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agreed_price DECIMAL(10, 2);

-- 3. Fix property_images.image_path: VARCHAR(255) is too small for base64 data URLs
ALTER TABLE property_images ALTER COLUMN image_path TYPE TEXT;

-- 4. Fix notifications.message: VARCHAR(255) can be too small for some notification messages
ALTER TABLE notifications ALTER COLUMN message TYPE TEXT;

-- 5. Add payment_contact_info column to properties table (stores MoMo and contact instructions as JSON)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_contact_info TEXT;

-- Done! All columns updated successfully.
