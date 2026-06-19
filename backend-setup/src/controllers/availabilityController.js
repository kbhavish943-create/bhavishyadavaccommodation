// src/controllers/availabilityController.js
// Availability Calendar Management
// Handles date availability, locking, and booking confirmation

const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const logger = require('../config/logger');

/**
 * Get availability for a date range
 * 
 * @route   GET /api/availability/halls/:hallId
 * @access  Public
 * @query   {fromDate, toDate}
 * @returns {availability array}
 */
exports.getAvailability = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { fromDate, toDate } = req.query;

    // Validate inputs
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: 'fromDate and toDate are required',
        code: 'INVALID_DATE_RANGE'
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    from.setUTCHours(0, 0, 0, 0);
    to.setUTCHours(23, 59, 59, 999);

    if (from > to) {
      return res.status(400).json({
        success: false,
        error: 'fromDate must be before toDate',
        code: 'INVALID_DATE_ORDER'
      });
    }

    // Verify hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found',
        code: 'HALL_NOT_FOUND'
      });
    }

    // Get availability for date range
    const availability = await Availability.find({
      hallId,
      date: { $gte: from, $lte: to }
    }).sort({ date: 1 });

    // If no records exist, create them as "available"
    if (availability.length === 0) {
      const dates = [];
      const currentDate = new Date(from);
      while (currentDate <= to) {
        dates.push({
          hallId,
          date: new Date(currentDate),
          status: 'available'
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      await Availability.insertMany(dates, { ordered: false });
    }

    // Fetch updated availability
    const result = await Availability.find({
      hallId,
      date: { $gte: from, $lte: to }
    }).sort({ date: 1 });

    res.json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    logger.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Set availability for specific dates
 * 
 * @route   POST /api/availability/halls/:hallId/set
 * @access  Protected (Vendor - hall owner)
 * @body    {dates, status}
 * @returns {updated count}
 */
exports.setAvailability = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { dates, status } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'dates array is required',
        code: 'INVALID_DATES'
      });
    }

    if (!['available', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be available or blocked',
        code: 'INVALID_STATUS'
      });
    }

    // Verify hall ownership
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found',
        code: 'HALL_NOT_FOUND'
      });
    }

    if (hall.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this hall',
        code: 'UNAUTHORIZED'
      });
    }

    // Update availability for each date
    const updates = await Promise.all(
      dates.map(dateStr => {
        const d = new Date(dateStr);
        d.setUTCHours(0, 0, 0, 0);
        
        return Availability.findOneAndUpdate(
          { hallId, date: d },
          { status, $unset: { bookingId: '', lockedUntil: '' } },
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      success: true,
      message: `Updated ${updates.length} dates to ${status}`,
      updated: updates.length
    });

  } catch (error) {
    logger.error('Set availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set availability',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Lock dates for booking (internal use)
 * Called during booking creation with MongoDB transaction
 * 
 * @internal
 * @param {ObjectId} hallId
 * @param {Array<Date>} dates
 * @param {ObjectId} bookingId
 * @param {Session} session - MongoDB session for transaction
 * @returns {success boolean}
 */
exports.lockDates = async (hallId, dates, bookingId, session) => {
  const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  for (const date of dates) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const availDoc = await Availability.findOneAndUpdate(
      {
        hallId,
        date: d,
        status: { $in: ['available', 'locked'] }
      },
      {
        $set: {
          status: 'locked',
          bookingId,
          lockedUntil
        }
      },
      { upsert: false, new: true, session }
    );

    if (!availDoc) {
      throw new Error(`Could not lock date ${d.toISOString()}`);
    }
  }

  return true;
};

/**
 * Unlock dates (release lock without confirming)
 * Called if payment fails
 * 
 * @route   POST /api/availability/unlock
 * @access  Internal/Webhook
 * @body    {bookingId}
 */
exports.unlockDates = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const result = await Availability.updateMany(
      { bookingId },
      {
        $set: { status: 'available' },
        $unset: { bookingId: '', lockedUntil: '' }
      }
    );

    res.json({
      success: true,
      message: 'Dates unlocked',
      updated: result.modifiedCount
    });

  } catch (error) {
    logger.error('Unlock dates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock dates',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Mark dates as booked (finalize after payment success)
 * Called by webhook after payment confirmation
 * 
 * @route   POST /api/availability/mark-booked
 * @access  Internal/Webhook
 * @body    {bookingId}
 */
exports.markBooked = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const result = await Availability.updateMany(
      { bookingId },
      {
        $set: { status: 'booked' },
        $unset: { lockedUntil: '' }
      }
    );

    res.json({
      success: true,
      message: 'Dates marked as booked',
      updated: result.modifiedCount
    });

  } catch (error) {
    logger.error('Mark booked error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark dates as booked',
      code: 'SERVER_ERROR'
    });
  }
};
