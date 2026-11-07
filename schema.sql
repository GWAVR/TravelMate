-- TravelMate Super Admin Relational Database Schema (MySQL 8.0+ / MariaDB)
-- Production-ready schema for Admin RBAC, Analytics, AI Auditing, and Data Exports

CREATE DATABASE IF NOT EXISTS travelmate_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE travelmate_db;

-- 1. Users Table (Stores regular users and ADMIN accounts with bcrypt salted password hashes)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'USER' COMMENT 'USER, ADMIN, or SUPER_ADMIN',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE or SUSPENDED',
  avatar TEXT NULL,
  bio TEXT NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  dates VARCHAR(100) NULL,
  days_total INT DEFAULT 7,
  budget_limit_usd DECIMAL(10,2) DEFAULT 1200.00,
  spent_usd DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Active' COMMENT 'Active, Planned, Completed, Archived',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trips_user_id (user_id),
  INDEX idx_trips_status (status),
  CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Itinerary Activities Table
CREATE TABLE IF NOT EXISTS itinerary_activities (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  day INT DEFAULT 1,
  time_slot VARCHAR(50) DEFAULT 'Morning',
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Sightseeing',
  cost_usd DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_itinerary_trip (trip_id),
  CONSTRAINT fk_itinerary_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  amount_local DECIMAL(10,2) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  category VARCHAR(100) NOT NULL,
  payer_name VARCHAR(255) NULL,
  date VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expenses_trip (trip_id),
  INDEX idx_expenses_user (user_id),
  INDEX idx_expenses_category (category),
  INDEX idx_expenses_currency (currency),
  CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Destinations Catalog Table
CREATE TABLE IF NOT EXISTS destinations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  continent VARCHAR(100) DEFAULT 'Asia',
  category VARCHAR(100) DEFAULT 'Must-See Wonder',
  rating DECIMAL(3,1) DEFAULT 4.8,
  trips_count INT DEFAULT 0,
  hero_image TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_destinations_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TripGenie AI Usage & Telemetry Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id VARCHAR(64) PRIMARY KEY,
  endpoint VARCHAR(100) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL COMMENT 'success or error',
  latency_ms INT NOT NULL,
  tokens_estimated INT DEFAULT 0,
  error_message TEXT NULL,
  ip_address VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_created (created_at),
  INDEX idx_ai_status (status),
  INDEX idx_ai_feature (feature)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Admin Audit & Security Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NULL,
  resource_id VARCHAR(100) NULL,
  details TEXT NULL,
  ip_address VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_admin (admin_email),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Maharashtra Hotel Lodging & Reservations Table
CREATE TABLE IF NOT EXISTS hotel_reservations (
  id VARCHAR(64) PRIMARY KEY,
  booking_ref VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(64) NOT NULL,
  trip_id VARCHAR(64) NULL,
  hotel_id VARCHAR(64) NOT NULL,
  hotel_name VARCHAR(255) NOT NULL,
  hotel_image TEXT,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  room_type_id VARCHAR(64) NOT NULL,
  room_type_name VARCHAR(100) NOT NULL,
  check_in_date VARCHAR(50) NOT NULL,
  check_out_date VARCHAR(50) NOT NULL,
  nights_count INT NOT NULL DEFAULT 1,
  guests_count INT NOT NULL DEFAULT 1,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  special_requests TEXT NULL,
  room_rate_per_night_inr DECIMAL(10,2) NOT NULL,
  total_amount_inr DECIMAL(10,2) NOT NULL,
  total_amount_usd DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Confirmed' COMMENT 'Confirmed, Completed, Cancelled',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'Pay at Hotel' COMMENT 'Paid, Pay at Hotel',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_res_user (user_id),
  INDEX idx_res_trip (trip_id),
  INDEX idx_res_district (district),
  INDEX idx_res_status (status),
  INDEX idx_res_booking_ref (booking_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

