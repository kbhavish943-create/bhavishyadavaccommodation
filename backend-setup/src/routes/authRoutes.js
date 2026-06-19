// src/routes/authRoutes.js
// Authentication Routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, sanitizeInput } = require('../middleware/validation');
const { verifyToken, verifyRefreshToken } = require('../middleware/auth');
const validators = require('../utils/validators');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 * @body    {name, email, phone, password, userType, address}
 */
router.post('/register', sanitizeInput, validate(validators.registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    {email, password}
 */
router.post('/login', sanitizeInput, validate(validators.loginSchema), authController.login);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for email verification
 * @access  Public
 * @body    {email, otp}
 */
router.post('/verify-otp', sanitizeInput, validate(validators.otpVerificationSchema), authController.verifyOTPCode);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 * @body    {email}
 */
router.post('/resend-otp', sanitizeInput, validate(validators.resendOtpSchema), authController.resendOTP);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Protected (requires refresh token)
 * @body    {refreshToken}
 */
router.post('/refresh-token', sanitizeInput, validate(validators.refreshTokenSchema), verifyRefreshToken, authController.refreshAccessToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
