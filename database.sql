-- Database Schema for My Website
-- Created: December 1, 2025

-- Create database
CREATE DATABASE IF NOT EXISTS my_website;
USE my_website;

-- Table: Contact Form Submissions
CREATE TABLE IF NOT EXISTS contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message LONGTEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  read_status BOOLEAN DEFAULT FALSE,
  INDEX idx_email (email),
  INDEX idx_submitted_at (submitted_at)
);

-- Table: Users (for future authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  role ENUM('admin', 'user') DEFAULT 'user',
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Table: Featured Items (Videos, Hospitality Services, Ceremony Grounds)
CREATE TABLE IF NOT EXISTS featured_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  category ENUM('video', 'hospitality_services', 'ceremony_grounds') NOT NULL,
  thumbnail_url VARCHAR(500),
  content_url VARCHAR(500),
  release_date DATE,
  rating DECIMAL(3, 1),
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_featured BOOLEAN DEFAULT FALSE,
  INDEX idx_category (category),
  INDEX idx_release_date (release_date),
  INDEX idx_is_featured (is_featured)
);

-- Table: Features/Services
CREATE TABLE IF NOT EXISTS features (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  category VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50),
  order_position INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_order (order_position)
);

-- Table: Gallery Items
CREATE TABLE IF NOT EXISTS gallery_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  display_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_order (display_order)
);

-- Table: Site Settings
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value LONGTEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
);

-- Table: Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_title', 'My Website', 'Main site title'),
('site_description', 'Modern website with vibrant design', 'Site meta description'),
('contact_email', 'kbhavish943@gmail.com', 'Primary contact email'),
('contact_phone', '+91 87091 88179', 'Contact phone number'),
('timezone', 'Asia/Kolkata', 'Default timezone'),
('items_per_page', '10', 'Pagination limit'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode');

-- Insert sample features
INSERT INTO features (name, description, category, icon_name, order_position) VALUES
('Server-side Caching', 'Lightning-fast content delivery with intelligent caching', 'Performance', '⚡', 1),
('Image Optimization', 'Automatic image compression and responsive sizing', 'Performance', '🖼️', 2),
('Critical CSS', 'Optimized CSS loading for instant first paint', 'Performance', '✂️', 3),
('Bundle Splitting', 'Code splitting for efficient resource loading', 'Performance', '📦', 4),
('HTTP/2 & Push', 'Modern HTTP protocols for faster downloads', 'Performance', '🚀', 5),
('Design System', 'Consistent, scalable design components', 'Design', '🎨', 6),
('Responsive Layout', 'Perfect display on all devices', 'Design', '📱', 7),
('High-quality Visuals', 'Premium imagery and graphics', 'Design', '✨', 8),
('Typography Scale', 'Carefully balanced font hierarchy', 'Design', '📝', 9),
('Theme Support', 'Dark and light theme toggles', 'Design', '🌙', 10),
('Keyboard Friendly', 'Full keyboard navigation support', 'Accessibility', '⌨️', 11),
('Readable Contrast', 'WCAG AA compliant color contrast', 'Accessibility', '👁️', 12),
('ARIA Roles', 'Semantic markup with ARIA labels', 'Accessibility', '🏷️', 13),
('Screen Reader Support', 'Fully compatible with assistive tech', 'Accessibility', '🔊', 14),
('Reduced Motion', 'Respects prefers-reduced-motion', 'Accessibility', '⏸️', 15),
('Dark Mode', 'Low-light comfortable viewing', 'Interaction', '🌑', 16),
('Accessible Forms', 'Proper validation and error messages', 'Interaction', '📋', 17),
('Lightbox Gallery', 'Modal image viewing experience', 'Interaction', '🖼️', 18),
('Notifications', 'Real-time user feedback', 'Interaction', '🔔', 19),
('Progressive Enhancement', 'Works without JavaScript', 'Interaction', '⬆️', 20);

-- Create views for common queries
CREATE VIEW contact_summary AS
SELECT 
  COUNT(*) as total_submissions,
  SUM(CASE WHEN read_status = FALSE THEN 1 ELSE 0 END) as unread_count,
  MAX(submitted_at) as last_submission,
  COUNT(DISTINCT email) as unique_contacts
FROM contacts;

CREATE VIEW featured_content AS
SELECT 
  id,
  title,
  category,
  views,
  rating,
  created_at
FROM featured_items
WHERE is_featured = TRUE
ORDER BY views DESC;

-- Sample queries for reference:
-- 
-- Get all unread contact submissions:
-- SELECT * FROM contacts WHERE read_status = FALSE ORDER BY submitted_at DESC;
--
-- Get contact stats:
-- SELECT * FROM contact_summary;
--
-- Get featured items by category:
-- SELECT * FROM featured_items WHERE category = 'webseries' AND is_featured = TRUE;
--
-- Get all active features by category:
-- SELECT * FROM features WHERE is_active = TRUE ORDER BY category, order_position;
--
-- Get site settings:
-- SELECT * FROM settings;
