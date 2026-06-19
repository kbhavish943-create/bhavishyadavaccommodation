-- MySQL Database Schema for Payment Processing
-- This script creates the necessary tables for storing payment information

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider` ENUM('razorpay', 'stripe') NOT NULL COMMENT 'Payment gateway provider',
  `provider_order_id` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Order ID from payment provider',
  `payment_id` VARCHAR(100) COMMENT 'Payment/Transaction ID from provider',
  `amount` INT NOT NULL COMMENT 'Amount in smallest currency unit (paise/cents)',
  `currency` ENUM('INR', 'USD') DEFAULT 'INR',
  `method` VARCHAR(50) COMMENT 'Payment method: card, upi, netbanking, wallet, etc.',
  `status` ENUM('pending', 'authorized', 'paid', 'failed', 'refunded', 'disputed', 'expired') DEFAULT 'pending',
  `user_id` INT COMMENT 'Reference to user table if applicable',
  `user_email` VARCHAR(100),
  `user_ip` VARCHAR(45) COMMENT 'IPv4 or IPv6 address',
  `user_agent` TEXT COMMENT 'Browser user agent',
  `notes` TEXT COMMENT 'Additional notes',
  `metadata` JSON COMMENT 'Custom metadata',
  `error_message` TEXT COMMENT 'Error details if payment failed',
  `verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_provider_order_id` (`provider_order_id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payment transactions table';

-- Refunds table for tracking refund operations
CREATE TABLE IF NOT EXISTS `refunds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `provider` ENUM('razorpay', 'stripe') NOT NULL,
  `refund_id` VARCHAR(100) UNIQUE NOT NULL,
  `amount` INT NOT NULL,
  `reason` VARCHAR(255),
  `status` ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_refund_id` (`refund_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disputes/Chargebacks table
CREATE TABLE IF NOT EXISTS `disputes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `provider` ENUM('razorpay', 'stripe') NOT NULL,
  `dispute_id` VARCHAR(100) UNIQUE NOT NULL,
  `amount` INT NOT NULL,
  `reason` TEXT,
  `status` ENUM('warning', 'under_review', 'won', 'lost') DEFAULT 'under_review',
  `evidence_due_date` DATE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_dispute_id` (`dispute_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook logs for debugging
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider` ENUM('razorpay', 'stripe') NOT NULL,
  `event_type` VARCHAR(100),
  `event_id` VARCHAR(100) UNIQUE,
  `payload` JSON,
  `signature_valid` BOOLEAN DEFAULT FALSE,
  `processed` BOOLEAN DEFAULT FALSE,
  `error` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_event_id` (`event_id`),
  KEY `idx_provider` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert trigger to log status changes
DELIMITER $$
CREATE TRIGGER order_status_log AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO webhook_logs (provider, event_type, event_id, payload, processed)
    VALUES (NEW.provider, CONCAT('order.', NEW.status), NEW.provider_order_id, 
            JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status), TRUE);
  END IF;
END$$
DELIMITER ;
