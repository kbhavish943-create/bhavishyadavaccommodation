// src/models/Booking.js
// Booking Model for Event Reservations

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    
    // Event Details
    eventType: {
      type: String,
      enum: ['marriage', 'birthday', 'corporate', 'engagement', 'anniversary', 'other'],
      required: true,
      index: true
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'At least 1 guest required']
    },
    
    // Time Details
    eventTime: {
      start: String, // HH:MM format
      end: String
    },
    setupTime: String,
    cleanupTime: String,
    
    // Pricing
    pricing: {
      hallPrice: { type: Number, required: true },
      cateringPrice: { type: Number, default: 0 },
      decorationPrice: { type: Number, default: 0 },
      additionalCharges: { type: Number, default: 0 },
      subtotal: Number,
      platformFee: Number,
      gst: Number,
      discount: { type: Number, default: 0 },
      totalAmount: {
        type: Number,
        required: [true, 'Total amount is required']
      }
    },
    
    // Payment Information
    payment: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
        index: true
      },
      method: String, // 'razorpay', 'stripe', 'upi', 'wallet'
      transactionId: String,
      orderId: String,
      paymentDate: Date,
      paidAmount: { type: Number, default: 0 },
      refundedAmount: { type: Number, default: 0 },
      refundDate: Date,
      refundReason: String,
      failureReason: String
    },
    
    // Advance Payment
    advancePayment: {
      percentage: { type: Number, default: 50 },
      amount: Number,
      paidDate: Date,
      status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
      }
    },
    
    // Booking Status
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String,
        reason: String
      }
    ],
    
    // Customer Details
    customerDetails: {
      name: String,
      phone: String,
      email: String,
      company: String // for corporate events
    },
    
    // Special Requirements
    specialRequirements: String,
    colorTheme: String,
    decorationStyle: String,
    
    // Cancellation
    cancellation: {
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected'],
        default: 'none'
      },
      requestedAt: Date,
      refundPercentage: Number,
      refundAmount: Number,
      approvedAt: Date,
      approvedBy: mongoose.Schema.Types.ObjectId,
      reason: String
    },
    
    // Modifications
    modifications: [
      {
        type: String, // e.g., 'guest_count_change'
        oldValue: String,
        newValue: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: mongoose.Schema.Types.ObjectId
      }
    ],
    
    // Confirmations
    confirmations: {
      vendorConfirmed: { type: Boolean, default: false },
      customerConfirmed: { type: Boolean, default: false },
      guestCountConfirmed: { type: Boolean, default: false },
      menuConfirmed: { type: Boolean, default: false },
      paymentConfirmed: { type: Boolean, default: false }
    },
    
    // Communication
    notes: String,
    vendorNotes: String,
    internalNotes: String,
    
    // Metadata
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
BookingSchema.index({ customerId: 1, bookingStatus: 1 });
BookingSchema.index({ vendorId: 1, eventDate: 1 });
BookingSchema.index({ hallId: 1, eventDate: 1 });
BookingSchema.index({ eventDate: 1 });
BookingSchema.index({ 'payment.status': 1 });

// Pre-save middleware to generate bookingId
BookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = `BK_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
