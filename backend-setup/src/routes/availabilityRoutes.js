// src/routes/availabilityRoutes.js
// Availability Calendar Management Routes

const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route   GET /api/availability/halls/:hallId
 * @desc    Get availability for date range
 * @access  Public
 * @query   {fromDate, toDate}
 */
router.get('/halls/:hallId', availabilityController.getAvailability);

/**
 * @route   POST /api/availability/halls/:hallId/set
 * @desc    Set availability for dates (vendor only)
 * @access  Protected (Vendor)
 * @body    {dates, status}
 */
router.post(
  '/halls/:hallId/set',
  verifyToken,
  checkRole('vendor'),
  availabilityController.setAvailability
);

/**
 * @route   POST /api/availability/unlock
 * @desc    Unlock dates (payment failed)
 * @access  Internal/Webhook
 * @body    {bookingId}
 */
router.post('/unlock', availabilityController.unlockDates);

/**
 * @route   POST /api/availability/mark-booked
 * @desc    Mark dates as booked (payment success)
 * @access  Internal/Webhook
 * @body    {bookingId}
 */
router.post('/mark-booked', availabilityController.markBooked);

module.exports = router;
