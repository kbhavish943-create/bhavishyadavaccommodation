// src/routes/bookingRoutes.js
// Booking Management Routes

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route   POST /api/bookings
 * @desc    Create new booking (with atomic availability locking)
 * @access  Protected (Customer)
 * @body    {hallId, eventDate, eventType, guestCount, totalAmount, ...}
 */
router.post(
  '/',
  verifyToken,
  checkRole('customer'),
  bookingController.createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    Get customer's bookings
 * @access  Protected (Customer)
 */
router.get('/', verifyToken, checkRole('customer'), bookingController.getBookings);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking details
 * @access  Protected (Customer or Vendor)
 */
router.get('/:bookingId', verifyToken, bookingController.getBookingDetails);

/**
 * @route   PATCH /api/bookings/:bookingId/status
 * @desc    Update booking status (internal/webhook)
 * @access  Internal/Webhook
 * @body    {status, reason}
 */
router.patch('/:bookingId/status', bookingController.updateBookingStatus);

module.exports = router;
