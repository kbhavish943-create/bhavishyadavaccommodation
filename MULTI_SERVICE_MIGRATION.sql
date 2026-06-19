-- ============================================================
-- MULTI-SERVICE BOOKING PLATFORM - DATABASE MIGRATION
-- From: Hotel-Only System
-- To: Hotels + Marriage Halls + Birthday Venues + Party Halls + Services
-- ============================================================

-- Step 1: Add service category system
-- ============================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert service categories
INSERT INTO service_categories (name, slug, icon, description, sort_order) VALUES
('Hotels', 'hotels', '🏨', 'Hotel rooms and accommodations', 1),
('Marriage Halls', 'marriage-halls', '💍', 'Wedding and marriage event venues', 2),
('Birthday Venues', 'birthday-venues', '🎂', 'Birthday party and celebration spaces', 3),
('Party Halls', 'party-halls', '🎉', 'Party and function halls for events', 4),
('Event Services', 'event-services', '✨', 'Catering, photography, decoration, DJ services', 5)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- Step 2: Create unified vendors table (replacing hotel_managers)
-- ============================================================

CREATE TABLE IF NOT EXISTS vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verification_status ENUM('pending', 'verified', 'rejected', 'blocked') DEFAULT 'pending',
  verification_date DATETIME,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_bookings INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  response_time_hours INT DEFAULT 24,
  profile_image VARCHAR(255),
  cover_image VARCHAR(255),
  business_description TEXT,
  documents JSON,
  bank_details JSON,
  gst_number VARCHAR(15),
  years_in_business INT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  suspension_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  UNIQUE KEY unique_vendor_user (user_id, category_id),
  INDEX idx_category (category_id),
  INDEX idx_verification (verification_status),
  INDEX idx_city (city),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Migrate existing hotel_managers to vendors
-- ============================================================

-- (Note: This assumes you have hotel_managers table)
-- INSERT INTO vendors (user_id, business_name, category_id, phone, email, address, city, verification_status)
-- SELECT user_id, manager_name, 1, phone, email, address, city, 'verified'
-- FROM hotel_managers
-- WHERE user_id NOT IN (SELECT user_id FROM vendors);

-- Step 4: Create vendor services (replaces hotel.rooms concept)
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  capacity INT,
  service_duration_minutes INT,
  amenities JSON,
  images JSON,
  features JSON,
  rules TEXT,
  cancellation_policy TEXT,
  availability_type ENUM('always', 'slots', 'calendar') DEFAULT 'calendar',
  advance_booking_days INT DEFAULT 30,
  minimum_notice_hours INT DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  booking_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  INDEX idx_vendor (vendor_id),
  INDEX idx_service_type (service_type),
  INDEX idx_price (base_price),
  INDEX idx_capacity (capacity),
  FULLTEXT INDEX ft_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Create availability slots (calendar management)
-- ============================================================

CREATE TABLE IF NOT EXISTS availability_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT NOT NULL,
  available_from DATETIME NOT NULL,
  available_until DATETIME NOT NULL,
  max_bookings INT DEFAULT 1,
  booked_count INT DEFAULT 0,
  price DECIMAL(10, 2),
  slot_status ENUM('available', 'blocked', 'fully_booked', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
  INDEX idx_service (service_id),
  INDEX idx_availability (service_id, available_from, available_until),
  INDEX idx_status (slot_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: Create unified bookings table
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  service_id INT NOT NULL,
  category_id INT NOT NULL,
  booking_date DATETIME NOT NULL,
  checkin_date DATETIME,
  checkout_date DATETIME,
  guest_count INT NOT NULL,
  special_requests TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_code VARCHAR(50),
  final_amount DECIMAL(10, 2) NOT NULL,
  booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'refunded') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'partially_paid', 'refunded') DEFAULT 'unpaid',
  cancellation_reason VARCHAR(255),
  cancellation_initiated_by ENUM('customer', 'vendor', 'admin'),
  cancellation_date DATETIME,
  refund_status ENUM('no_refund', 'pending', 'completed', 'failed') DEFAULT 'no_refund',
  refund_amount DECIMAL(10, 2),
  refund_date DATETIME,
  vendor_notes TEXT,
  customer_notes TEXT,
  assigned_staff_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (service_id) REFERENCES vendor_services(id),
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  INDEX idx_customer (customer_id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_service (service_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (booking_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_reference (booking_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 7: Create reviews & ratings table
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  service_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT,
  photos JSON,
  service_rating INT,
  cleanliness_rating INT,
  value_rating INT,
  staff_rating INT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  vendor_response TEXT,
  vendor_response_date DATETIME,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (service_id) REFERENCES vendor_services(id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_service (service_id),
  INDEX idx_rating (rating),
  INDEX idx_verified (is_verified_purchase)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 8: Create payments table (enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('card', 'upi', 'wallet', 'net_banking', 'cod') DEFAULT 'card',
  payment_gateway ENUM('razorpay', 'stripe', 'paytm', 'paypal') DEFAULT 'razorpay',
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_signature VARCHAR(255),
  payment_status ENUM('pending', 'initiated', 'authorized', 'captured', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_date DATETIME,
  payment_receipt VARCHAR(255),
  platform_fee DECIMAL(10, 2),
  gst_amount DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  refund_id VARCHAR(255),
  refund_status ENUM('no_refund', 'pending', 'completed', 'failed') DEFAULT 'no_refund',
  refund_amount DECIMAL(10, 2),
  refund_date DATETIME,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_booking (booking_id),
  INDEX idx_status (payment_status),
  INDEX idx_gateway (payment_gateway),
  INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 9: Create vendor payouts table
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_bookings INT,
  total_amount DECIMAL(12, 2),
  platform_fees DECIMAL(10, 2),
  taxes DECIMAL(10, 2),
  net_payout_amount DECIMAL(12, 2),
  payout_method ENUM('bank_transfer', 'check', 'wallet') DEFAULT 'bank_transfer',
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  ifsc_code VARCHAR(15),
  payout_reference VARCHAR(255),
  payout_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_status (payout_status),
  INDEX idx_period (payout_period_start, payout_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 10: Create wishlists table
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  service_id INT NOT NULL,
  vendor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (customer_id, service_id),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 11: Create platform settings table
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value LONGTEXT,
  category VARCHAR(50),
  data_type ENUM('string', 'boolean', 'integer', 'json') DEFAULT 'string',
  description TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO platform_settings (setting_key, setting_value, category, data_type, description) VALUES
('platform_name', 'BookEase', 'general', 'string', 'Platform name'),
('platform_commission_percentage', '10', 'payment', 'integer', 'Commission % on all bookings'),
('payment_gateway_fee_percentage', '2.5', 'payment', 'integer', 'Payment gateway fee %'),
('min_advance_booking_hours', '24', 'booking', 'integer', 'Minimum hours for advance booking'),
('max_advance_booking_days', '365', 'booking', 'integer', 'Maximum days for advance booking'),
('cancellation_refund_percentage', '100', 'booking', 'integer', 'Full refund % if cancelled'),
('require_vendor_verification', 'true', 'vendor', 'boolean', 'Require vendor verification'),
('auto_release_payout_days', '7', 'payment', 'integer', 'Days after booking completion to release payout'),
('enable_customer_wallet', 'false', 'feature', 'boolean', 'Enable customer wallet feature')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Step 12: Create vendor staff table
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(15),
  role ENUM('staff', 'manager', 'coordinator') DEFAULT 'staff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_staff (vendor_id, user_id),
  INDEX idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 13: Create admin audit log table
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT,
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

ALTER TABLE vendors ADD INDEX idx_city_state (city, state);
ALTER TABLE vendors ADD INDEX idx_featured (is_featured, is_active);
ALTER TABLE vendor_services ADD INDEX idx_vendor_active (vendor_id, is_active);
ALTER TABLE availability_slots ADD INDEX idx_date_range (available_from, available_until);
ALTER TABLE bookings ADD INDEX idx_created (created_at);
ALTER TABLE reviews ADD INDEX idx_created (created_at);
ALTER TABLE payments ADD INDEX idx_created (created_at);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Verify tables created
SELECT 'Tables created successfully!' as status;
