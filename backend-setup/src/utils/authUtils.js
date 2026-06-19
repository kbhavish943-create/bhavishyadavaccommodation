// src/utils/authUtils.js
// JWT and OTP utilities for authentication

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../config/logger');

// ============================================
// JWT UTILITIES
// ============================================

/**
 * Generate JWT Access Token
 * @param {Object} payload - User data to encode
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.userType - User type (customer, vendor, admin)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '7d',
      algorithm: 'HS256'
    });
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate JWT Refresh Token
 * @param {Object} payload - User data to encode
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
      algorithm: 'HS256'
    });
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Generate both Access and Refresh Tokens
 * @param {Object} user - User object
 * @returns {Object} {accessToken, refreshToken}
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    userType: user.userType
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

/**
 * Verify JWT Token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret key to use
 * @returns {Object} Decoded token
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('Token verification error:', error);
    throw error;
  }
};

/**
 * Decode JWT without verification (unsafe, for debugging only)
 * @param {string} token - Token to decode
 * @returns {Object} Decoded token
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

// ============================================
// OTP UTILITIES
// ============================================

/**
 * Generate OTP
 * @param {number} length - OTP length (default: 6)
 * @returns {string} Generated OTP
 */
const generateOTP = (length = 6) => {
  const otp = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1))
    .toString()
    .substring(0, length);
  return otp;
};

/**
 * Generate OTP with expiry
 * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {Object} {code, expiresAt}
 */
const generateOTPWithExpiry = (expiryMinutes = 10) => {
  const code = generateOTP(6);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return {
    code,
    expiresAt
  };
};

/**
 * Verify OTP
 * @param {string} providedOTP - OTP provided by user
 * @param {string} storedOTP - OTP stored in database
 * @param {Date} expiryDate - OTP expiry date
 * @returns {Object} {valid: boolean, error?: string}
 */
const verifyOTP = (providedOTP, storedOTP, expiryDate) => {
  if (!storedOTP) {
    return { valid: false, error: 'OTP not generated' };
  }

  if (new Date() > expiryDate) {
    return { valid: false, error: 'OTP has expired' };
  }

  if (providedOTP !== storedOTP) {
    return { valid: false, error: 'Invalid OTP' };
  }

  return { valid: true };
};

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Hash password (should be done via Mongoose pre-save hook)
 * @param {string} password - Plain password
 * @param {number} saltRounds - Salt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = 10) => {
  const bcrypt = require('bcryptjs');
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if match
 */
const comparePassword = async (password, hash) => {
  const bcrypt = require('bcryptjs');
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw error;
  }
};

/**
 * Generate password reset token
 * @returns {Object} {token, hash, expiresAt}
 */
const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  return {
    token,
    hash,
    expiresAt
  };
};

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Generate secure random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure token for email verification
 * @returns {Object} {token, hash, expiresAt}
 */
const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token,
    hash,
    expiresAt
  };
};

/**
 * Verify webhook signature (Razorpay)
 * @param {string} body - Request body
 * @param {string} signature - Signature from header
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if valid
 */
const verifyRazorpaySignature = (body, signature, secret) => {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    logger.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Create signature for Razorpay requests
 * @param {string} orderId - Razorpay order ID
 * @param {string} amount - Payment amount
 * @param {string} secret - Razorpay secret
 * @returns {string} HMAC-SHA256 signature
 */
const createRazorpaySignature = (orderId, amount, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${amount}`)
    .digest('hex');
};

module.exports = {
  // JWT
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,

  // OTP
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP,

  // Password
  hashPassword,
  comparePassword,
  generatePasswordResetToken,

  // Security
  generateRandomString,
  generateEmailVerificationToken,
  verifyRazorpaySignature,
  createRazorpaySignature
};
