// src/models/Availability.js
// Availability Calendar Model for Event Hall Bookings
// CRITICAL: Manages date-wise locking to prevent double-bookings

const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema(
  {
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: [true, 'Hall ID is required'],
      index: true
    },

    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },

    status: {
      type: String,
      enum: {
        values: ['available', 'locked', 'booked'],
        message: 'Status must be available, locked, or booked'
      },
      default: 'available',
      index: true
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },

    lockedUntil: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

/**
 * UNIQUE COMPOUND INDEX (hallId + date)
 * 
 * This is CRITICAL for atomic locking.
 * Ensures only ONE row per hall per date exists.
 * 
 * Without this:
 * - Multiple dates could be locked for same hall+date
 * - Webhook couldn't find unique row to update
 * - Race conditions would occur
 * 
 * With this:
 * - findOneAndUpdate automatically upserts safely
 * - Atomic locking is guaranteed
 * - Payment webhook can reliably confirm dates
 */
AvailabilitySchema.index({ hallId: 1, date: 1 }, { unique: true });

/**
 * Additional indexes for efficient queries
 */
AvailabilitySchema.index({ hallId: 1, status: 1 });
AvailabilitySchema.index({ hallId: 1, date: 1, status: 1 });

/**
 * PRE-SAVE HOOK: Normalize date to start of day (UTC)
 * 
 * This ensures dates are consistently stored as:
 * 2024-12-25 00:00:00 UTC
 * 
 * NOT mixed with time components that could break uniqueness.
 */
AvailabilitySchema.pre('save', function (next) {
  if (this.date) {
    // Set date to start of day in UTC
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

/**
 * SCHEMA DOCUMENTATION
 * 
 * STATUS FLOW for Event Bookings:
 * 
 * available → locked (when booking is created) [15-min TTL]
 *     ↓ (if payment succeeds)
 *   booked (when webhook confirms payment)
 *     ↓ (if payment fails)
 *   available (when lock expires or payment fails)
 * 
 * 
 * FIELDS EXPLAINED:
 * 
 * hallId: Which event hall/venue this date belongs to
 * date: The event date (stored as UTC start-of-day)
 * status: One of available/locked/booked
 * bookingId: Points to Booking doc if locked/booked
 * lockedUntil: Expiry time for lock (typically now + 15 mins)
 * 
 * 
 * WHY SEPARATE COLLECTION?
 * 
 * ❌ Embedding in Hall would require:
 *    - Updating arrays (slow)
 *    - Managing sub-documents (error-prone)
 *    - Complex queries (inefficient)
 * 
 * ✅ Separate collection enables:
 *    - Atomic findOneAndUpdate
 *    - Easy date-range queries
 *    - Cron-based cleanup
 *    - Safe concurrent locking
 */

module.exports = mongoose.model('Availability', AvailabilitySchema);
