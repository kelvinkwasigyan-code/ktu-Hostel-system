-- =============================================================================
-- KTU Student Hostel Portal — Complete Combined Database Migration & Seed Script
-- Single-file full setup for PostgreSQL / Supabase SQL Editor.
-- =============================================================================

-- Enable UUID extension (useful for Supabase Auth linkage)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLE: users
-- Stores all platform actors: Students, Landlords, Admins
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('Student', 'Landlord', 'Admin')),
    verification_status VARCHAR(20) DEFAULT 'Approved'
                        CHECK (verification_status IN ('Pending', 'Approved', 'Rejected')),
    id_document_path    VARCHAR(255) NULL,   -- landlord identity document path (Supabase Storage)
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. TABLE: properties
-- Off-campus housing listings created by verified Landlords.
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
    distance_from_campus_km  DECIMAL(5, 2),  -- cached via Distance Matrix API on creation
    availability_status      VARCHAR(20) DEFAULT 'Available'
                             CHECK (availability_status IN ('Available', 'Pending', 'Occupied')),
    verification_status      VARCHAR(20) DEFAULT 'Pending'
                             CHECK (verification_status IN ('Pending', 'Approved', 'Rejected')),
    created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_search
    ON properties (neighborhood, price_per_semester, room_type, availability_status, verification_status);

-- =============================================================================
-- 3. TABLE: property_images
-- Up to 5 photos per listing.
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_images (
    image_id      SERIAL PRIMARY KEY,
    property_id   INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    image_path    VARCHAR(255) NOT NULL,    -- Supabase Storage public URL
    display_order SMALLINT DEFAULT 0        -- 0 = primary/hero image
);

-- =============================================================================
-- 4. TABLE: bookings
-- 24-hour non-transactional reservation holds.
-- =============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id  SERIAL PRIMARY KEY,
    student_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    status      VARCHAR(20) DEFAULT 'Pending'
                CHECK (status IN ('Pending', 'Approved', 'Declined', 'Expired')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NULL,       -- set to created_at + INTERVAL '24 hours' on insert
    resolved_at TIMESTAMPTZ NULL
);

-- =============================================================================
-- 5. TABLE: reviews
-- Booking-gated peer reviews — only students with Approved bookings may review.
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
-- 6. TABLE: notifications
-- In-app notification center.
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

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications (recipient_id, is_read);

-- =============================================================================
-- 7. TABLE: vacancy_alerts
-- Students opt-in to alerts for saved search criteria.
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


-- =============================================================================
-- DEMO DATA SEEDING
-- =============================================================================

INSERT INTO users (full_name, email, phone, password_hash, role, verification_status, is_active) VALUES
-- Admin
('System Administrator',
 'admin@hostelportal.edu.gh',
 '+233241000000',
 '$2b$10$K7L1OJ45/4Y2nIvhRQ.Yjui0E9lT5JCmjxRq3GV7uo3f9.gK/oHDK',  -- Admin@1234
 'Admin', 'Approved', TRUE),

-- Landlords (verified)
('Kwame Asante Boateng',
 'kwame.asante@gmail.com',
 '+233244123456',
 '$2b$10$zXnW3MKaL.9qGPfV0Y1Oo.aQdT5ZUiQBVfqZ4mN/oK3bEjXeYvhMa',  -- Landlord@1
 'Landlord', 'Approved', TRUE),

('Abena Mensah Osei',
 'abena.mensah@gmail.com',
 '+233205678901',
 '$2b$10$zXnW3MKaL.9qGPfV0Y1Oo.aQdT5ZUiQBVfqZ4mN/oK3bEjXeYvhMa',
 'Landlord', 'Approved', TRUE),

('Kofi Darko Amponsah',
 'kofi.darko@gmail.com',
 '+233209876543',
 '$2b$10$zXnW3MKaL.9qGPfV0Y1Oo.aQdT5ZUiQBVfqZ4mN/oK3bEjXeYvhMa',
 'Landlord', 'Approved', TRUE),

('Ama Serwaa Asante',
 'ama.serwaa@gmail.com',
 '+233244567890',
 '$2b$10$zXnW3MKaL.9qGPfV0Y1Oo.aQdT5ZUiQBVfqZ4mN/oK3bEjXeYvhMa',
 'Landlord', 'Approved', TRUE),

-- Landlord pending verification
('Yaw Frimpong Boahen',
 'yaw.frimpong@gmail.com',
 '+233200112233',
 '$2b$10$zXnW3MKaL.9qGPfV0Y1Oo.aQdT5ZUiQBVfqZ4mN/oK3bEjXeYvhMa',
 'Landlord', 'Pending', TRUE),

-- Students
('Esi Adjoa Quaye',
 'esi.quaye@ktu.edu.gh',
 '+233554321098',
 '$2b$10$2c5OajRCqbzFjwP.sX0iFe7J3gY6YuDnQhMsWb0ZQ5K9kvH1LrGcC',  -- Student@1
 'Student', 'Approved', TRUE),

('Emmanuel Owusu Ansah',
 'emmanuel.owusu@ktu.edu.gh',
 '+233503456789',
 '$2b$10$2c5OajRCqbzFjwP.sX0iFe7J3gY6YuDnQhMsWb0ZQ5K9kvH1LrGcC',
 'Student', 'Approved', TRUE),

('Akosua Agyemang',
 'akosua.agyemang@ktu.edu.gh',
 '+233244987654',
 '$2b$10$2c5OajRCqbzFjwP.sX0iFe7J3gY6YuDnQhMsWb0ZQ5K9kvH1LrGcC',
 'Student', 'Approved', TRUE),

('Kojo Mensah Acheampong',
 'kojo.mensah@ktu.edu.gh',
 '+233271234567',
 '$2b$10$2c5OajRCqbzFjwP.sX0iFe7J3gY6YuDnQhMsWb0ZQ5K9kvH1LrGcC',
 'Student', 'Approved', TRUE),

('Adwoa Pokuaa Ntiamoah',
 'adwoa.pokuaa@ktu.edu.gh',
 '+233246543210',
 '$2b$10$2c5OajRCqbzFjwP.sX0iFe7J3gY6YuDnQhMsWb0ZQ5K9kvH1LrGcC',
 'Student', 'Approved', TRUE),

('Bright Asare Frimpong',
 'bright.asare@ktu.edu.gh',
 '+233509876543',
 '$2b$10$2c5OajRCqbzFjwP.sX0iFe7J3gY6YuDnQhMsWb0ZQ5K9kvH1LrGcC',
 'Student', 'Approved', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO properties
  (landlord_id, title, address, latitude, longitude, description,
   price_per_semester, room_type, max_occupancy, amenities, neighborhood,
   distance_from_campus_km, availability_status, verification_status)
VALUES
(2, 'Asante Court – Single Rooms',
 'Adweso Junction, Koforidua',
 6.0882, -0.2541,
 'Bright single rooms 5 minutes walk from KTU main gate. 24/7 security, borehole water, and reliable electricity. Suitable for serious students.',
 850.00, 'Single', 1,
 '["Running Water","Security","WiFi","Study Desk","Ceiling Fan","Security Light"]',
 'Adweso', 0.8, 'Available', 'Approved'),

(2, 'Asante Court – Shared Rooms',
 'Adweso Junction, Koforidua',
 6.0884, -0.2543,
 'Affordable shared rooms for 2 occupants. Same compound as our Single Rooms. Great community atmosphere.',
 550.00, 'Shared', 2,
 '["Running Water","Security","Study Desk","Ceiling Fan"]',
 'Adweso', 0.9, 'Available', 'Approved'),

(2, 'Asante Self-Contained Apartment',
 'Adweso Road, Koforidua',
 6.0890, -0.2538,
 'Modern self-contained unit with private bathroom and kitchenette. Perfect for students who prefer complete privacy.',
 1400.00, 'Self-contained', 1,
 '["Private Bathroom","Kitchenette","Running Water","Security","WiFi","Air Conditioning","Study Desk"]',
 'Adweso', 0.7, 'Occupied', 'Approved'),

(3, 'Nsukwao Student Lodge',
 'Nsukwao, behind KTU Tech Park',
 6.0862, -0.2589,
 'Well-maintained student hostel just behind KTU Tech Park. Clean rooms, courtyard with seating area, and generator backup.',
 700.00, 'Single', 1,
 '["Generator Backup","Running Water","Security","WiFi","Laundry Area","Study Desk","Ceiling Fan"]',
 'Nsukwao', 1.2, 'Available', 'Approved'),

(3, 'Nsukwao Budget Rooms',
 'Nsukwao Zongo Road, Koforidua',
 6.0858, -0.2601,
 'Budget-friendly shared accommodation for cost-conscious students. Shared kitchen available.',
 400.00, 'Shared', 2,
 '["Shared Kitchen","Ceiling Fan","Security"]',
 'Nsukwao', 1.5, 'Available', 'Approved'),

(3, 'Mensah Premium Apartments',
 'Nsukwao Main Road, Koforidua',
 6.0870, -0.2575,
 'Premium 1-bedroom apartments for postgraduate students or those seeking a higher standard of living near KTU.',
 2200.00, 'Apartment', 2,
 '["Private Bathroom","Full Kitchen","Air Conditioning","WiFi","Security","Parking","Generator Backup"]',
 'Nsukwao', 1.0, 'Available', 'Approved'),

(4, 'Effiduase Student Chambers',
 'Effiduase Road, Near KTU',
 6.0935, -0.2620,
 'Spacious chambers in Effiduase, popular with engineering students. Motorcycle hire available nearby.',
 600.00, 'Single', 1,
 '["Running Water","Security","Study Desk","Ceiling Fan","Compound Lighting"]',
 'Effiduase', 1.8, 'Available', 'Approved'),

(4, 'Darko Hostel – Economy Shared',
 'Effiduase Junction, Koforidua',
 6.0940, -0.2615,
 'Economy shared rooms for first-year students on a tight budget. Clean, safe, and close to campus.',
 350.00, 'Shared', 3,
 '["Running Water","Security","Ceiling Fan"]',
 'Effiduase', 1.9, 'Available', 'Approved'),

(4, 'Darko Executive Self-Contained',
 'Effiduase, Near Total Filling Station',
 6.0925, -0.2630,
 'Executive self-contained room with private veranda. Secure compound with CCTV.',
 1600.00, 'Self-contained', 1,
 '["Private Bathroom","CCTV","Security","WiFi","Air Conditioning","Study Desk","Generator Backup"]',
 'Effiduase', 2.0, 'Pending', 'Approved'),

(5, 'Oyoko Green Hostel',
 'Oyoko, Koforidua-Kumasi Road',
 6.0820, -0.2480,
 'Peaceful hostel set in Oyoko''s greenery. Ideal for students who prefer a calm study environment. Trotro direct to KTU gate.',
 750.00, 'Single', 1,
 '["Running Water","Security","Study Desk","WiFi","Ceiling Fan","Quiet Environment"]',
 'Oyoko', 2.5, 'Available', 'Approved'),

(5, 'Oyoko Shared Rooms',
 'Oyoko New Road, Koforidua',
 6.0815, -0.2475,
 'Affordable shared rooms with good security. Regular trotro to KTU available.',
 450.00, 'Shared', 2,
 '["Running Water","Security","Ceiling Fan"]',
 'Oyoko', 2.6, 'Available', 'Approved'),

(5, 'Serwaa Apartments – Studio',
 'Ashanti Nkwanta, Koforidua',
 6.0910, -0.2500,
 'Modern studio apartments in Ashanti Nkwanta. Recently renovated with new fittings. Great value.',
 1800.00, 'Apartment', 1,
 '["Private Bathroom","Kitchenette","Air Conditioning","WiFi","Security","Study Desk","Generator Backup"]',
 'Ashanti Nkwanta', 1.4, 'Available', 'Approved'),

(5, 'Serwaa Classic Self-Contained',
 'Ashanti Nkwanta Road, Koforidua',
 6.0905, -0.2510,
 'Classic self-contained room with large wardrobe and study area. Popular with female students.',
 1200.00, 'Self-contained', 1,
 '["Private Bathroom","Security","Running Water","Ceiling Fan","Study Desk","Wardrobe"]',
 'Ashanti Nkwanta', 1.3, 'Occupied', 'Approved'),

(2, 'Adweso Premium Block B',
 'Adweso, Near KTU Engineering Faculty',
 6.0877, -0.2548,
 'Block B rooms—slightly larger than Block A. Quiet block preferred by final-year students.',
 950.00, 'Single', 1,
 '["Running Water","Security","WiFi","Study Desk","Ceiling Fan","Wardrobe"]',
 'Adweso', 1.0, 'Available', 'Approved'),

(4, 'Akwadum Student Suites',
 'Akwadum Road, Koforidua',
 6.0960, -0.2650,
 'Suites in Akwadum with shared sitting room per floor. Suited for group study sessions.',
 800.00, 'Single', 1,
 '["Shared Sitting Room","Running Water","Security","Study Desk","WiFi"]',
 'Akwadum', 2.8, 'Available', 'Approved'),

(3, 'Mensah Budget Singles – Nsukwao',
 'Nsukwao Lane 3, Koforidua',
 6.0865, -0.2595,
 'No-frills single rooms at the best price in Nsukwao. Great for budget-conscious students.',
 480.00, 'Single', 1,
 '["Running Water","Security","Ceiling Fan"]',
 'Nsukwao', 1.4, 'Available', 'Approved'),

(5, 'Oyoko Premier Lodge',
 'Oyoko, Off Kumasi Road',
 6.0810, -0.2460,
 'Premier lodge with 24/7 security, borehole, and generator. The most popular hostel in Oyoko.',
 1100.00, 'Self-contained', 1,
 '["Private Bathroom","Generator Backup","Borehole Water","24/7 Security","WiFi","CCTV","Study Desk"]',
 'Oyoko', 3.0, 'Available', 'Approved'),

(6, 'Frimpong New Development',
 'Nsukwao Extension, Koforidua',
 6.0850, -0.2610,
 'Brand new development. 8 self-contained rooms with modern fittings.',
 1500.00, 'Self-contained', 1,
 '["Private Bathroom","Running Water","Security","Study Desk"]',
 'Nsukwao', 1.6, 'Available', 'Pending');

INSERT INTO property_images (property_id, image_path, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800', 0),
(1, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 1),
(2, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0),
(3, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 0),
(4, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 0),
(4, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', 1),
(5, 'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?w=800', 0),
(6, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 0),
(6, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800', 1),
(7, 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800', 0),
(8, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0),
(9, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 0),
(10, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 0),
(10, 'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?w=800', 1),
(11, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 0),
(12, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 0),
(13, 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800', 0),
(14, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800', 0),
(15, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 0),
(16, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 0),
(17, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 0);

INSERT INTO bookings (student_id, property_id, status, created_at, expires_at, resolved_at) VALUES
(7, 1, 'Approved', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
(8, 4, 'Approved', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
(9, 6, 'Approved', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(10, 2, 'Expired',  NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NULL),
(11, 5, 'Declined', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(12, 9, 'Pending',  NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours', NULL);

INSERT INTO reviews (student_id, property_id, booking_id, rating, comment, is_flagged) VALUES
(7, 1, 1, 5,
 'Excellent hostel! Very clean, the security guard is always on duty. The study desk is a great touch. I renewed for the second semester without hesitation.',
 FALSE),
(8, 4, 2, 4,
 'Good rooms and responsive landlord. The WiFi was occasionally slow but overall a pleasant stay. Good value for money in Nsukwao.',
 FALSE),
(9, 6, 3, 5,
 'Best apartment near KTU. The generator never let me down during load-shedding. Highly recommend to any student looking for premium accommodation.',
 FALSE);

INSERT INTO notifications (recipient_id, type, message, related_property_id, related_booking_id, is_read, delivery_channel) VALUES
(2, 'BookingRequest',
 'A student has placed a 24-hour hold on "Asante Court – Single Rooms". Review and respond within 24 hours.',
 1, 1, TRUE, 'InApp'),
(7, 'BookingAccepted',
 'Great news! Your reservation hold for "Asante Court – Single Rooms" has been accepted. Contact landlord: +233244123456.',
 1, 1, TRUE, 'InApp'),
(3, 'VerificationResult',
 'Your landlord account has been verified and approved. You can now create property listings.',
 NULL, NULL, TRUE, 'InApp'),
(4, 'BookingRequest',
 'A student has placed a 24-hour hold on "Darko Executive Self-Contained". Respond before it expires.',
 9, 6, FALSE, 'InApp'),
(12, 'System',
 'Your reservation hold for "Darko Executive Self-Contained" is active. The landlord has 24 hours to respond.',
 9, 6, FALSE, 'InApp');
