// src/controllers/bookingController.js
// Booking Management with Atomic Availability Locking
// CRITICAL: Uses MongoDB transactions to prevent double-booking

const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const Vendor = require('../models/Vendor');
const availabilityController = require('./availabilityController');
const logger = require('../config/logger');

/**
 * Create new booking with ATOMIC availability locking
 * 
 * Flow:
 * 1. Validate booking details
 * 2. Start MongoDB transaction
 * 3. Create booking (status = pending)
 * 4. Lock all event dates atomically
 * 5. If any date fails → rollback entire booking
 * 6. If all dates lock → commit transaction
 * 
 * @route   POST /api/bookings
 * @access  Protected (Customer)
 * @body    {hallId, eventDate, eventType, guestCount, totalAmount, eventTime, etc.}
 * @returns {booking with orderId ready for payment}
 */
exports.createBooking = async (req, res) => {
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const {
      hallId,
      eventDate,
      eventType,
      guestCount,
      totalAmount,
      eventTime,
      customerDetails,
      specialRequirements
    } = req.validatedData || req.body;

    // ===== VALIDATION =====
    if (!hallId || !eventDate || !eventType || !guestCount || !totalAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hallId, eventDate, eventType, guestCount, totalAmount',
        code: 'MISSING_FIELDS'
      });
    }

    // Verify hall exists
    const hall = await Hall.findById(hallId).session(session);
    if (!hall) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Hall not found',
        code: 'HALL_NOT_FOUND'
      });
    }

    // Verify customer exists
    if (!req.userId) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'UNAUTHORIZED'
      });
    }

    // ===== CREATE BOOKING (PENDING) =====
    const bookingData = {
      customerId: req.userId,
      hallId,
      vendorId: hall.vendorId,
      eventDate: new Date(eventDate),
      eventType,
      guestCount,
      bookingStatus: 'pending',
      pricing: {
        totalAmount,
        hallPrice: hall.basePrice || 0
      },
      eventTime,
      customerDetails,
      specialRequirements
    };

    const [booking] = await Booking.create([bookingData], { session });

    if (!booking) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        error: 'Failed to create booking',
        code: 'BOOKING_CREATION_FAILED'
      });
    }

    // ===== LOCK AVAILABILITY DATES (ATOMIC) =====
    try {
      await availabilityController.lockDates(
        hallId,
        [eventDate], // In real scenario, could be multiple dates
        booking._id,
        session
      );
    } catch (lockError) {
      await session.abortTransaction();
      logger.warn(`Failed to lock dates for booking ${booking._id}:`, lockError.message);
      
      return res.status(409).json({
        success: false,
        error: 'Selected date(s) are not available. Please choose different dates.',
        code: 'DATE_NOT_AVAILABLE',
        detail: lockError.message
      });
    }

    // ===== COMMIT TRANSACTION =====
    await session.commitTransaction();

    // ===== RETURN BOOKING READY FOR PAYMENT =====
    res.status(201).json({
      success: true,
      message: 'Booking created. Proceed to payment.',
      data: {
        bookingId: booking._id,
        orderId: booking.bookingId,
        hallId: booking.hallId,
        eventDate: booking.eventDate,
        totalAmount: booking.pricing.totalAmount,
        status: booking.bookingStatus,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        nextStep: 'Create payment order via POST /api/payments/create-order'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error('Create booking error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      code: 'SERVER_ERROR',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    session.endSession();
  }
};

/**
 * Get bookings by customer
 * 
 * @route   GET /api/bookings
 * @access  Protected (Customer)
 * @returns {bookings array}
 */
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.userId
    })
      .populate('hallId', 'hallName city')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    logger.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get booking details
 * 
 * @route   GET /api/bookings/:bookingId
 * @access  Protected (Customer - owner or Vendor - hall owner)
 * @returns {booking document}
 */
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email phone')
      .populate('hallId', 'hallName city basePrice')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check authorization
    const userId = String(req.userId);
    const isCustomer = String(booking.customerId?._id) === userId;
    const vendor = await Vendor.findById(booking.vendorId).select('userId').lean();
    const isVendor = String(vendor?.userId) === userId;

    if (!isCustomer && !isVendor) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this booking',
        code: 'UNAUTHORIZED'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    logger.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update booking status (internal use - called by webhook)
 * 
 * @route   PATCH /api/bookings/:bookingId/status
 * @access  Internal/Webhook
 * @body    {status, reason}
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        bookingStatus: status,
        $push: {
          'statusHistory': {
            status,
            changedAt: new Date(),
            reason
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });

  } catch (error) {
    logger.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      code: 'SERVER_ERROR'
    });
  }
};
