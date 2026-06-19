-- Hotel Booking System Database Schema
-- Created: December 19, 2025

-- Developers table (Super admin users)
CREATE TABLE IF NOT EXISTS `developers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dev_id` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100),
  `email` VARCHAR(100) UNIQUE,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_dev_id` (`dev_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotel Managers table
CREATE TABLE IF NOT EXISTS `managers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `manager_id` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100),
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `hotel_id` INT,
  `status` ENUM('pending', 'approved', 'rejected', 'inactive') DEFAULT 'pending',
  `approved_by` INT COMMENT 'Developer ID who approved',
  `approved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_manager_id` (`manager_id`),
  KEY `idx_status` (`status`),
  KEY `idx_hotel_id` (`hotel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotels table
CREATE TABLE IF NOT EXISTS `hotels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `description` TEXT,
  `rating` DECIMAL(3,1) DEFAULT 0,
  `total_rooms` INT DEFAULT 0,
  `is_visible` BOOLEAN DEFAULT TRUE COMMENT 'Visible to customers',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_by` INT COMMENT 'Developer ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_city` (`city`),
  KEY `idx_is_visible` (`is_visible`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rooms table
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hotel_id` INT NOT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `room_type` ENUM('single', 'double', 'suite', 'deluxe') DEFAULT 'double',
  `capacity` INT DEFAULT 2,
  `price_per_night` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `status` ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
  `amenities` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_room_number` (`hotel_id`, `room_number`),
  KEY `idx_hotel_id` (`hotel_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table (OTP-based login)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phone_number` VARCHAR(20) UNIQUE NOT NULL,
  `name` VARCHAR(100),
  `email` VARCHAR(100) UNIQUE,
  `otp_code` VARCHAR(6),
  `otp_expires_at` TIMESTAMP NULL,
  `otp_attempts` INT DEFAULT 0,
  `last_otp_request` TIMESTAMP NULL,
  `status` ENUM('active', 'blocked') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` VARCHAR(50) UNIQUE NOT NULL,
  `hotel_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `number_of_guests` INT DEFAULT 1,
  `number_of_nights` INT GENERATED ALWAYS AS (DATEDIFF(check_out_date, check_in_date)) STORED,
  `total_price` DECIMAL(10,2) NOT NULL,
  `special_requests` TEXT,
  `status` ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  `payment_method` VARCHAR(50),
  `payment_id` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_hotel_id` (`hotel_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_check_in_date` (`check_in_date`),
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP logs table (for audit trail)
CREATE TABLE IF NOT EXISTS `otp_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phone_number` VARCHAR(20) NOT NULL,
  `otp_code` VARCHAR(6),
  `request_type` ENUM('request', 'verify', 'resend') DEFAULT 'request',
  `status` ENUM('sent', 'verified', 'expired', 'failed') DEFAULT 'sent',
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature toggles table (Developer controls)
CREATE TABLE IF NOT EXISTS `feature_toggles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `feature_name` VARCHAR(100) UNIQUE NOT NULL,
  `is_enabled` BOOLEAN DEFAULT TRUE,
  `description` TEXT,
  `updated_by` INT COMMENT 'Developer ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_feature_name` (`feature_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotel toggles table (Manager controls - per hotel)
CREATE TABLE IF NOT EXISTS `hotel_toggles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hotel_id` INT NOT NULL,
  `show_to_customers` BOOLEAN DEFAULT TRUE,
  `enable_online_booking` BOOLEAN DEFAULT TRUE,
  `enable_online_payment` BOOLEAN DEFAULT TRUE,
  `updated_by` INT COMMENT 'Manager ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_hotel` (`hotel_id`),
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default developers (for testing)
INSERT IGNORE INTO `developers` (`dev_id`, `password`, `name`, `email`) VALUES
('DEV001', 'dev123', 'Developer Admin', 'dev@example.com');

-- Insert default feature toggles
INSERT IGNORE INTO `feature_toggles` (`feature_name`, `is_enabled`, `description`) VALUES
('online_booking', TRUE, 'Enable online hotel bookings'),
('online_payment', TRUE, 'Enable online payment processing'),
('razorpay', TRUE, 'Enable Razorpay payment gateway'),
('stripe', TRUE, 'Enable Stripe payment gateway'),
('email_notifications', TRUE, 'Send email notifications'),
('sms_notifications', TRUE, 'Send SMS notifications');
