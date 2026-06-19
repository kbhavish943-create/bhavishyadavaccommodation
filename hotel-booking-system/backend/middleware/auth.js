/**
 * Authentication Middleware
 * Handles token validation and role-based access control
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel-booking-secret-key';
const JWT_EXPIRY = '7d';

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate JWT token for any user role
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Generate tokens for user login
 */
function generateAuthTokens(userId, userRole, userEmail) {
  const accessToken = generateToken({
    id: userId,
    role: userRole,
    email: userEmail,
    iat: Date.now()
  });

  const refreshToken = generateToken({
    id: userId,
    role: userRole,
    type: 'refresh',
    iat: Date.now()
  });

  return { accessToken, refreshToken };
}

// ============================================================
// TOKEN VERIFICATION MIDDLEWARE
// ============================================================

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware: Extract and verify token from request
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }

  req.user = decoded;
  next();
}

// ============================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================

/**
 * Middleware: Check user role
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware: Require Developer role
 */
function requireDeveloper(req, res, next) {
  return requireRole('developer')(req, res, next);
}

/**
 * Middleware: Require Hotel Manager role
 */
function requireManager(req, res, next) {
  return requireRole('manager')(req, res, next);
}

/**
 * Middleware: Require Customer role
 */
function requireCustomer(req, res, next) {
  return requireRole('customer')(req, res, next);
}

/**
 * Middleware: Require Developer or Hotel Manager
 */
function requireDeveloperOrManager(req, res, next) {
  return requireRole('developer', 'manager')(req, res, next);
}

// ============================================================
// CONTROL PRIORITY ENFORCEMENT
// ============================================================

/**
 * Middleware: Enforce control priority
 * Developer > Hotel Manager > Customer
 * 
 * Developer can override manager/customer decisions
 * Manager can override customer decisions
 */
function enforceControlPriority(req, res, next) {
  // Store control level for later use
  const roleControlLevel = {
    developer: 3,
    manager: 2,
    customer: 1
  };

  req.controlLevel = roleControlLevel[req.user?.role] || 0;
  next();
}

// ============================================================
// OTP GENERATION & VERIFICATION
// ============================================================

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify OTP (check if it matches and not expired)
 */
function verifyOTP(storedOTP, expiresAt, providedOTP) {
  if (!storedOTP || !expiresAt) {
    return false;
  }

  // Check if OTP expired
  if (new Date() > new Date(expiresAt)) {
    return false;
  }

  // Check if OTP matches
  return storedOTP === providedOTP;
}

// ============================================================
// ERROR HANDLING UTILITIES
// ============================================================

/**
 * Standard error response
 */
function sendError(res, statusCode, message, code = null, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code: code,
    details: details
  });
}

/**
 * Standard success response
 */
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: data
  });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  generateToken,
  generateAuthTokens,
  verifyToken,
  authenticateToken,
  requireRole,
  requireDeveloper,
  requireManager,
  requireCustomer,
  requireDeveloperOrManager,
  enforceControlPriority,
  generateOTP,
  verifyOTP,
  sendError,
  sendSuccess
};
