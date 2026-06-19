/**
 * Authentication Routes
 * Handles login for Developer, Hotel Manager, and Customer
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const {
  generateAuthTokens,
  generateOTP,
  verifyOTP,
  sendSuccess,
  sendError
} = require('../middleware/auth');

// ============================================================
// 1. DEVELOPER LOGIN
// ============================================================

/**
 * POST /auth/developer/login
 * Login for Super Admin (Developer)
 * Required: dev_id, dev_password
 */
router.post('/developer/login', async (req, res) => {
  try {
    const { dev_id, password } = req.body;

    // Validate input
    if (!dev_id || !password) {
      return sendError(res, 400, 'Developer ID and password are required', 'MISSING_FIELDS');
    }

    // Find developer
    const [developers] = await pool.execute(
      'SELECT id, dev_id, dev_password_hash, name, email FROM developers WHERE dev_id = ?',
      [dev_id]
    );

    if (developers.length === 0) {
      return sendError(res, 401, 'Invalid developer credentials', 'INVALID_CREDENTIALS');
    }

    const developer = developers[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, developer.dev_password_hash);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid developer credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(
      developer.id,
      'developer',
      developer.email
    );

    // Log the login
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type) VALUES (?, ?, ?, ?)',
      ['developer', developer.id, 'login', 'developer']
    );

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: developer.id,
        dev_id: developer.dev_id,
        name: developer.name,
        email: developer.email,
        role: 'developer'
      }
    }, 'Developer login successful', 200);

  } catch (error) {
    console.error('Developer login error:', error);
    return sendError(res, 500, 'Server error during login', 'SERVER_ERROR');
  }
});

// ============================================================
// 2. HOTEL MANAGER LOGIN
// ============================================================

/**
 * POST /auth/manager/login
 * Login for Hotel Manager
 * Required: manager_id, password
 */
router.post('/manager/login', async (req, res) => {
  try {
    const { manager_id, password } = req.body;

    // Validate input
    if (!manager_id || !password) {
      return sendError(res, 400, 'Manager ID and password are required', 'MISSING_FIELDS');
    }

    // Find manager
    const [managers] = await pool.execute(
      `SELECT hm.id, hm.manager_id, hm.manager_password_hash, hm.name, 
              hm.email, hm.hotel_id, hm.is_approved_by_developer, h.name as hotel_name
       FROM hotel_managers hm
       JOIN hotels h ON hm.hotel_id = h.id
       WHERE hm.manager_id = ? AND hm.is_active = TRUE`,
      [manager_id]
    );

    if (managers.length === 0) {
      return sendError(res, 401, 'Invalid manager credentials or account inactive', 'INVALID_CREDENTIALS');
    }

    const manager = managers[0];

    // Check if manager is approved by developer
    if (!manager.is_approved_by_developer) {
      return sendError(res, 403, 'Your account is pending approval from the developer', 'PENDING_APPROVAL');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, manager.manager_password_hash);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid manager credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(
      manager.id,
      'manager',
      manager.email
    );

    // Log the login
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type) VALUES (?, ?, ?, ?)',
      ['manager', manager.id, 'login', 'manager']
    );

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: manager.id,
        manager_id: manager.manager_id,
        name: manager.name,
        email: manager.email,
        hotel_id: manager.hotel_id,
        hotel_name: manager.hotel_name,
        role: 'manager'
      }
    }, 'Manager login successful', 200);

  } catch (error) {
    console.error('Manager login error:', error);
    return sendError(res, 500, 'Server error during login', 'SERVER_ERROR');
  }
});

// ============================================================
// 3. CUSTOMER OTP REQUEST
// ============================================================

/**
 * POST /auth/customer/request-otp
 * Request OTP for customer login (no password needed)
 * Required: phone_number
 */
router.post('/customer/request-otp', async (req, res) => {
  try {
    const { phone_number } = req.body;

    // Validate phone number
    if (!phone_number) {
      return sendError(res, 400, 'Phone number is required', 'MISSING_FIELD');
    }

    // Check if OTP feature is enabled
    const [settings] = await pool.execute(
      'SELECT setting_value FROM website_settings WHERE setting_key = ?',
      ['otp_enabled']
    );

    if (settings.length > 0 && settings[0].setting_value === 'false') {
      return sendError(res, 403, 'OTP login is currently disabled', 'OTP_DISABLED');
    }

    // Find or create customer
    let [customers] = await pool.execute(
      'SELECT id FROM customers WHERE phone_number = ?',
      [phone_number]
    );

    let customerId;
    if (customers.length === 0) {
      // Create new customer account
      const [result] = await pool.execute(
        'INSERT INTO customers (phone_number, name) VALUES (?, ?)',
        [phone_number, 'Customer']
      );
      customerId = result.insertId;
    } else {
      customerId = customers[0].id;
    }

    // Generate OTP (6 digits)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    // Store OTP in database
    await pool.execute(
      'UPDATE customers SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
      [otp, otpExpiry, customerId]
    );

    // TODO: Send OTP via SMS (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${phone_number}: ${otp}`); // For development

    return sendSuccess(res, {
      phone_number: phone_number,
      otp_expiry_seconds: 600, // 10 minutes
      message: 'OTP sent to your phone number'
    }, 'OTP sent successfully', 200);

  } catch (error) {
    console.error('OTP request error:', error);
    return sendError(res, 500, 'Server error requesting OTP', 'SERVER_ERROR');
  }
});

// ============================================================
// 4. CUSTOMER OTP VERIFICATION & LOGIN
// ============================================================

/**
 * POST /auth/customer/verify-otp
 * Verify OTP and login customer
 * Required: phone_number, otp_code
 */
router.post('/customer/verify-otp', async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body;

    // Validate input
    if (!phone_number || !otp_code) {
      return sendError(res, 400, 'Phone number and OTP are required', 'MISSING_FIELDS');
    }

    // Find customer
    const [customers] = await pool.execute(
      'SELECT id, name, email, otp_code, otp_expires_at, is_phone_verified FROM customers WHERE phone_number = ?',
      [phone_number]
    );

    if (customers.length === 0) {
      return sendError(res, 404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const customer = customers[0];

    // Verify OTP
    const isOtpValid = verifyOTP(customer.otp_code, customer.otp_expires_at, otp_code);
    if (!isOtpValid) {
      return sendError(res, 401, 'Invalid or expired OTP', 'INVALID_OTP');
    }

    // Mark phone as verified and clear OTP
    await pool.execute(
      'UPDATE customers SET is_phone_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, last_login = NOW() WHERE id = ?',
      [customer.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(
      customer.id,
      'customer',
      customer.email || phone_number
    );

    // Log the login
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type) VALUES (?, ?, ?, ?)',
      ['customer', customer.id, 'login', 'customer']
    );

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: customer.id,
        phone_number: phone_number,
        name: customer.name,
        email: customer.email,
        role: 'customer'
      }
    }, 'Customer login successful', 200);

  } catch (error) {
    console.error('OTP verification error:', error);
    return sendError(res, 500, 'Server error verifying OTP', 'SERVER_ERROR');
  }
});

// ============================================================
// 5. REFRESH TOKEN
// ============================================================

/**
 * POST /auth/refresh-token
 * Generate new access token using refresh token
 */
router.post('/refresh-token', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, 'Refresh token is required', 'MISSING_FIELD');
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return sendError(res, 403, 'Invalid refresh token', 'INVALID_TOKEN');
    }

    // Generate new access token
    const { generateToken } = require('../middleware/auth');
    const newAccessToken = generateToken({
      id: decoded.id,
      role: decoded.role,
      iat: Date.now()
    });

    return sendSuccess(res, {
      accessToken: newAccessToken
    }, 'Token refreshed successfully', 200);

  } catch (error) {
    console.error('Token refresh error:', error);
    return sendError(res, 500, 'Server error refreshing token', 'SERVER_ERROR');
  }
});

// ============================================================
// 6. LOGOUT
// ============================================================

/**
 * POST /auth/logout
 * Logout user (clear tokens on client side)
 */
router.post('/logout', (req, res) => {
  // In a real app, you might want to blacklist the token
  // For now, just return success - client will remove tokens
  return sendSuccess(res, null, 'Logout successful', 200);
});

module.exports = router;
