// src/controllers/authController.js
// Authentication Controller for User Registration and Login

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { generateTokenPair, generateOTPWithExpiry, verifyOTP } = require('../utils/authUtils');
const logger = require('../config/logger');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, userType, address } = req.validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email or phone already registered',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password, // Will be hashed by pre-save hook
      userType,
      address
    });

    await user.save();

    // Generate OTP for email verification
    const { code, expiresAt } = generateOTPWithExpiry(10);
    user.otp = { code, expiresAt, attempts: 0 };
    await user.save();

    // TODO: Send OTP to email (integrate nodemailer)
    logger.info(`User registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to your email.',
      data: {
        userId: user._id,
        email: user.email,
        userType: user.userType,
        requiresOTPVerification: true
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Account is ${user.status}`,
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if account is locked (brute force protection)
    if (user.lockUntil && new Date() < user.lockUntil) {
      return res.status(429).json({
        success: false,
        error: 'Account temporarily locked. Try again later.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        logger.warn(`Account locked: ${email}`);
      }

      await user.save();

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`User logged in: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        accessToken,
        refreshToken,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
const verifyOTPCode = async (req, res) => {
  try {
    const { email, otp } = req.validatedData;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.otp?.code, user.otp?.expiresAt);

    if (!verification.valid) {
      if (!user.otp) {
        user.otp = { attempts: 0 };
      }

      user.otp.attempts = (user.otp.attempts || 0) + 1;

      if (user.otp.attempts >= 5) {
        // Regenerate OTP and lock for 15 minutes
        const newOTP = generateOTPWithExpiry(15);
        user.otp = { code: newOTP.code, expiresAt: newOTP.expiresAt, attempts: 0 };
        logger.warn(`OTP verification attempts exceeded: ${email}`);
      }

      await user.save();

      return res.status(400).json({
        success: false,
        error: verification.error,
        code: 'OTP_VERIFICATION_FAILED'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.otp = null;
    await user.save();

    logger.info(`Email verified: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    logger.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'OTP verification failed',
      code: 'OTP_ERROR'
    });
  }
};

/**
 * Refresh Access Token
 * POST /api/auth/refresh-token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { userId } = req;
    const { refreshToken: providedRefreshToken } = req.validatedData;

    const user = await User.findById(userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'INVALID_USER'
      });
    }

    if (!user.refreshToken || user.refreshToken !== providedRefreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token mismatch',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { userId } = req;

    // Clear refresh token
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      lastLogin: new Date()
    });

    logger.info(`User logged out: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.validatedData;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Generate new OTP
    const { code, expiresAt } = generateOTPWithExpiry(10);
    user.otp = { code, expiresAt, attempts: 0 };
    await user.save();

    // TODO: Send OTP to email

    logger.info(`OTP resent: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'OTP resent to your email'
    });
  } catch (error) {
    logger.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resend OTP',
      code: 'RESEND_OTP_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  verifyOTPCode,
  refreshAccessToken,
  logout,
  resendOTP
};
