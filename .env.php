<?php
/**
 * Environment Configuration File
 * 
 * DO NOT COMMIT THIS FILE TO VERSION CONTROL
 * Add .env.php to .gitignore
 * 
 * Copy from .env.example and fill with your actual credentials.
 */

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');  // Change to your database password
define('DB_NAME', 'payment_system');  // Create this database first

// ============================================================================
// RAZORPAY CONFIGURATION (India - INR)
// ============================================================================
// Get these from https://dashboard.razorpay.com/app/keys
define('RAZORPAY_KEY_ID', 'rzp_test_XXXXXXXXXXXX');  // Replace with test key
define('RAZORPAY_KEY_SECRET', 'rzp_test_XXXXXXXXXXXX');  // Replace with test secret
define('RAZORPAY_WEBHOOK_SECRET', 'whsec_XXXXXXXXXXXX');  // Replace with webhook secret

// ============================================================================
// STRIPE CONFIGURATION (Global - USD)
// ============================================================================
// Get these from https://dashboard.stripe.com/apikeys
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_XXXXXXXXXXXX');  // Replace with publishable key
define('STRIPE_SECRET_KEY', 'sk_test_XXXXXXXXXXXX');  // Replace with secret key
define('STRIPE_WEBHOOK_SECRET', 'whsec_XXXXXXXXXXXX');  // Replace with webhook secret

// ============================================================================
// ENVIRONMENT SETTINGS
// ============================================================================
define('APP_ENV', 'development');  // development or production
define('APP_DEBUG', true);  // Set to false in production
define('APP_URL', 'http://localhost:3000');

// ============================================================================
// LOGGING & SECURITY
// ============================================================================
define('LOG_PATH', __DIR__ . '/logs');
define('LOG_ERRORS', true);
define('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000');

// ============================================================================
// EMAIL CONFIGURATION (Optional)
// ============================================================================
define('MAIL_FROM', 'noreply@yourdomain.com');
define('MAIL_FROM_NAME', 'Your Website');

// ============================================================================
// MONITORING (Optional)
// ============================================================================
define('SENTRY_DSN', '');  // Leave empty for now
define('ANALYTICS_ENABLED', false);

?>
