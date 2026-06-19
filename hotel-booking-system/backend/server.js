/**
 * Hotel Booking System - Main Express Server
 * Three-tier role-based hotel booking platform
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================
// DATABASE CONNECTION CHECK (must be before routes)
// ============================================================

app.use(async (req, res, next) => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({
      success: false,
      error: 'Database connection failed',
      error_code: 'DB_CONNECTION_ERROR'
    });
  }
});

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes (public + protected)
app.use('/api/auth', require('./routes/auth'));

// Developer routes (protected - developer only)
app.use('/api/developer', require('./routes/developer'));

// Manager routes (protected - manager only)
app.use('/api/manager', require('./routes/manager'));

// Customer routes (public + protected)
app.use('/api/customer', require('./routes/customer'));

// Payment routes (protected + webhooks)
app.use('/api/payment', require('./routes/payment'));

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    error_code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    error_code: err.code || 'SERVER_ERROR'
  });
});

// ============================================================
// SERVER STARTUP
// ============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   HOTEL BOOKING SYSTEM - BACKEND SERVER   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Server running on http://localhost:${PORT}${' '.repeat(5)}║`);
  console.log('║  Environment:', process.env.NODE_ENV || 'development');
  console.log('║  Database:', process.env.DB_NAME || 'hotel_booking_system');
  console.log('╠════════════════════════════════════════════╣');
  console.log('║  AVAILABLE ENDPOINTS:                      ║');
  console.log('║  • POST /api/auth/developer/login          ║');
  console.log('║  • POST /api/auth/manager/login            ║');
  console.log('║  • POST /api/auth/customer/request-otp     ║');
  console.log('║  • POST /api/auth/customer/verify-otp      ║');
  console.log('║  • GET  /api/developer/*                   ║');
  console.log('║  • GET  /api/manager/*                     ║');
  console.log('║  • GET  /api/customer/*                    ║');
  console.log('║  • POST /api/payment/*                     ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
