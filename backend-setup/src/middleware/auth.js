// src/middleware/auth.js
// Authentication & Authorization Middleware

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Verify JWT Token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    req.email = decoded.email;

    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Verify Refresh Token
const verifyRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;

    next();
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};

// Check User Role
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userType) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.userType)) {
      logger.warn(`Unauthorized access attempt by user ${req.userId} with role ${req.userType}`);
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource',
        code: 'UNAUTHORIZED',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

// Optional Auth - Don't fail if no token, just populate userId if available
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userType = decoded.userType;
      req.email = decoded.email;
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed, continuing as unauthenticated');
  }

  next();
};

// Rate Limiting Middleware
const createRateLimiter = (windowMs, maxRequests) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

// Request Logging Middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
      code: 'DUPLICATE_ENTRY'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path
  });
};

module.exports = {
  verifyToken,
  verifyRefreshToken,
  checkRole,
  optionalAuth,
  createRateLimiter,
  requestLogger,
  errorHandler,
  notFoundHandler
};
