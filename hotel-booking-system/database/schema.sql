-- 🏨 Hotel Booking System - MySQL Database Schema
-- Database: hotel_booking_system
-- Version: 1.0.0

CREATE DATABASE IF NOT EXISTS hotel_booking_system;
USE hotel_booking_system;

-- ============================================================
-- 1. DEVELOPERS (Super Admin) TABLE
-- ============================================================
CREATE TABLE developers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dev_id VARCHAR(50) UNIQUE NOT NULL,
  dev_password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  avatar_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_dev_id (dev_id),
  KEY idx_email (email),
  KEY idx_is_active (is_active)
);

-- ============================================================
-- 2. WEBSITE SETTINGS (Global Feature Toggles)
-- ============================================================
CREATE TABLE website_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT,
  data_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_setting_key (setting_key)
);

-- Insert default settings
INSERT INTO website_settings (setting_key, setting_value, description, data_type) VALUES
('online_booking_enabled', 'true', 'Enable/Disable online booking globally', 'boolean'),
('online_payment_enabled', 'true', 'Enable/Disable online payment globally', 'boolean'),
('room_availability_visible', 'true', 'Show room availability to customers', 'boolean'),
('upi_payment_enabled', 'true', 'Enable UPI payment', 'boolean'),
('card_payment_enabled', 'true', 'Enable Card payment', 'boolean'),
('otp_enabled', 'true', 'Enable OTP-based customer login', 'boolean');

-- ============================================================
-- 3. HOTELS TABLE
-- ============================================================
CREATE TABLE hotels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  rating DECIMAL(3, 1) DEFAULT 0,
  total_rooms INT DEFAULT 0,
  available_rooms INT DEFAULT 0,
  price_per_night DECIMAL(10, 2) NOT NULL,
  hotel_image_url VARCHAR(255),
  amenities JSON,
  is_active BOOLEAN DEFAULT TRUE,
  is_approved_by_developer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_city (city),
  KEY idx_is_active (is_active),
  KEY idx_is_approved (is_approved_by_developer),
  KEY idx_rating (rating)
);

-- ============================================================
-- 4. HOTEL MANAGERS TABLE
-- ============================================================
CREATE TABLE hotel_managers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  manager_id VARCHAR(50) UNIQUE NOT NULL,
  manager_password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  profile_image_url VARCHAR(255),
  
  -- Manager Permissions/Controls
  can_manage_rooms BOOLEAN DEFAULT TRUE,
  can_toggle_booking BOOLEAN DEFAULT TRUE,
  can_toggle_payment BOOLEAN DEFAULT TRUE,
  can_update_prices BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_approved_by_developer BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  KEY idx_manager_id (manager_id),
  KEY idx_hotel_id (hotel_id),
  KEY idx_is_approved (is_approved_by_developer),
  KEY idx_is_active (is_active)
);

-- ============================================================
-- 5. ROOMS TABLE
-- ============================================================
CREATE TABLE rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  room_type ENUM('single', 'double', 'suite', 'deluxe') NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  capacity INT NOT NULL,
  description TEXT,
  room_image_url VARCHAR(255),
  amenities JSON,
  
  -- Status & Visibility
  status ENUM('available', 'booked', 'maintenance', 'inactive') DEFAULT 'available',
  is_visible_to_customers BOOLEAN DEFAULT TRUE,
  allow_online_booking BOOLEAN DEFAULT TRUE,
  allow_online_payment BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_number (hotel_id, room_number),
  KEY idx_hotel_id (hotel_id),
  KEY idx_status (status),
  KEY idx_room_type (room_type),
  KEY idx_is_visible (is_visible_to_customers)
);

-- ============================================================
-- 6. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP NULL,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  
  profile_image_url VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_phone_number (phone_number),
  KEY idx_email (email),
  KEY idx_is_active (is_active),
  KEY idx_is_verified (is_phone_verified)
);

-- ============================================================
-- 7. BOOKINGS TABLE
-- ============================================================
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  hotel_id INT NOT NULL,
  room_id INT NOT NULL,
  
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_nights INT NOT NULL,
  number_of_guests INT NOT NULL,
  
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  booking_source ENUM('online', 'phone', 'walkin') DEFAULT 'online',
  
  special_requests TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  
  KEY idx_booking_number (booking_number),
  KEY idx_customer_id (customer_id),
  KEY idx_hotel_id (hotel_id),
  KEY idx_room_id (room_id),
  KEY idx_status (status),
  KEY idx_check_in (check_in_date),
  KEY idx_check_out (check_out_date)
);

-- ============================================================
-- 8. PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  hotel_id INT NOT NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('upi', 'card', 'wallet', 'bank_transfer') NOT NULL,
  payment_gateway ENUM('razorpay', 'stripe', 'paypal') NOT NULL,
  
  gateway_transaction_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  
  transaction_details JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  
  KEY idx_payment_id (payment_id),
  KEY idx_booking_id (booking_id),
  KEY idx_customer_id (customer_id),
  KEY idx_status (status),
  KEY idx_gateway_transaction (gateway_transaction_id)
);

-- ============================================================
-- 9. BOOKING STATUS HISTORY TABLE
-- ============================================================
CREATE TABLE booking_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  old_status ENUM('pending', 'confirmed', 'cancelled', 'completed'),
  new_status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL,
  changed_by VARCHAR(100),
  changed_by_role ENUM('developer', 'manager', 'customer', 'system') DEFAULT 'system',
  reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  KEY idx_booking_id (booking_id),
  KEY idx_created_at (created_at)
);

-- ============================================================
-- 10. AUDIT LOG TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_type ENUM('developer', 'manager', 'customer') NOT NULL,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_user_type (user_type),
  KEY idx_user_id (user_id),
  KEY idx_action (action),
  KEY idx_created_at (created_at)
);

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- View: Hotel with Manager Info
CREATE VIEW hotel_manager_view AS
SELECT 
  h.id,
  h.name,
  h.city,
  h.available_rooms,
  hm.name AS manager_name,
  hm.email AS manager_email,
  hm.phone AS manager_phone,
  hm.is_approved_by_developer,
  h.is_approved_by_developer AS hotel_approved
FROM hotels h
LEFT JOIN hotel_managers hm ON h.id = hm.hotel_id;

-- View: Booking with Details
CREATE VIEW booking_details_view AS
SELECT 
  b.id,
  b.booking_number,
  c.name AS customer_name,
  c.phone_number,
  h.name AS hotel_name,
  r.room_number,
  r.room_type,
  b.check_in_date,
  b.check_out_date,
  b.number_of_nights,
  b.total_amount,
  b.status,
  b.created_at
FROM bookings b
JOIN customers c ON b.customer_id = c.id
JOIN hotels h ON b.hotel_id = h.id
JOIN rooms r ON b.room_id = r.id;

-- View: Payment Summary
CREATE VIEW payment_summary_view AS
SELECT 
  h.id,
  h.name AS hotel_name,
  COUNT(p.id) AS total_transactions,
  SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) AS total_revenue,
  SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS successful_payments,
  SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END) AS failed_payments
FROM hotels h
LEFT JOIN payments p ON h.id = p.hotel_id
GROUP BY h.id, h.name;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Composite indexes for common queries
CREATE INDEX idx_hotel_date_status ON bookings(hotel_id, check_in_date, status);
CREATE INDEX idx_customer_date ON bookings(customer_id, created_at);
CREATE INDEX idx_payment_status_date ON payments(status, created_at);
CREATE INDEX idx_room_hotel_status ON rooms(hotel_id, status, is_visible_to_customers);

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert sample developer account (password: 'Admin@123' - hashed in production)
INSERT INTO developers (dev_id, dev_password_hash, name, email, phone) VALUES
('DEV001', '$2b$10$...$', 'Admin Developer', 'admin@hotelbook.com', '+91-9999999999');

-- Insert sample hotel
INSERT INTO hotels (name, description, address, city, state, postal_code, phone, email, price_per_night, total_rooms, available_rooms, is_approved_by_developer) VALUES
('The Grand Hotel', 'A 5-star luxury hotel in the heart of the city', '123 Main Street', 'Mumbai', 'Maharashtra', '400001', '+91-2261234567', 'info@grandhotel.com', 5000.00, 50, 50, TRUE);

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- Procedure: Update booking status with history
DELIMITER //
CREATE PROCEDURE UpdateBookingStatus(
  IN p_booking_id INT,
  IN p_new_status VARCHAR(20),
  IN p_changed_by VARCHAR(100),
  IN p_role VARCHAR(20),
  IN p_reason TEXT
)
BEGIN
  DECLARE v_old_status VARCHAR(20);
  
  -- Get current status
  SELECT status INTO v_old_status FROM bookings WHERE id = p_booking_id;
  
  -- Update booking status
  UPDATE bookings SET status = p_new_status WHERE id = p_booking_id;
  
  -- Log status change
  INSERT INTO booking_status_history 
  (booking_id, old_status, new_status, changed_by, changed_by_role, reason)
  VALUES (p_booking_id, v_old_status, p_new_status, p_changed_by, p_role, p_reason);
END //
DELIMITER ;

-- Procedure: Check room availability
DELIMITER //
CREATE PROCEDURE CheckRoomAvailability(
  IN p_room_id INT,
  IN p_check_in DATE,
  IN p_check_out DATE,
  OUT p_is_available BOOLEAN
)
BEGIN
  DECLARE v_booking_count INT;
  
  SELECT COUNT(*) INTO v_booking_count FROM bookings
  WHERE room_id = p_room_id
  AND status IN ('pending', 'confirmed')
  AND (
    (check_in_date <= p_check_in AND check_out_date > p_check_in)
    OR (check_in_date < p_check_out AND check_out_date >= p_check_out)
    OR (check_in_date >= p_check_in AND check_out_date <= p_check_out)
  );
  
  SET p_is_available = (v_booking_count = 0);
END //
DELIMITER ;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
