// src/app.js
// Main Express Application Setup

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const fileUpload = require('express-fileupload');
const os = require('os');
require('express-async-errors');
require('dotenv').config();

const { createRateLimiter, requestLogger, errorHandler, notFoundHandler } = require('./middleware/auth');
const { sanitizeInput } = require('./middleware/validation');

// Initialize Express app
const app = express();
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// File Upload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  responseOnLimit: {
    success: false,
    error: 'File too large',
    code: 'FILE_SIZE_EXCEEDED'
  }
}));

// Logging
app.use(requestLogger);

// Input Sanitization
app.use(sanitizeInput);

// Rate Limiting
const limiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
app.use('/api/', limiter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// API ROUTES
// ============================================

// Authentication Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Hall Routes
const hallRoutes = require('./routes/hallRoutes');
app.use('/api/halls', hallRoutes);

// Availability Routes (CRITICAL for atomic locking)
const availabilityRoutes = require('./routes/availabilityRoutes');
app.use('/api/availability', availabilityRoutes);

// Booking Routes (with atomic availability locking)
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Payment Routes (Razorpay + Stripe with webhook handlers)
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// ============================================
// TODO: ADDITIONAL ROUTES (TO BE ADDED)
// ============================================

// // Review Routes
// const reviewRoutes = require('./routes/reviewRoutes');
// app.use('/api/reviews', reviewRoutes);

// // User Profile Routes
// const userRoutes = require('./routes/userRoutes');
// app.use('/api/users', userRoutes);

// // Vendor Routes
// const vendorRoutes = require('./routes/vendorRoutes');
// app.use('/api/vendors', vendorRoutes);

// // Admin Routes
// const adminRoutes = require('./routes/adminRoutes');
// app.use('/api/admin', adminRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (MUST be last)
app.use(errorHandler);

module.exports = app;
