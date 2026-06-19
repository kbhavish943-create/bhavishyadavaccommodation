// src/models/Payment.js
// Payment Transaction Log Model

const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: true
    },
    
    // Payment Details
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'GBP', 'EUR']
    },
    paymentType: {
      type: String,
      enum: ['advance', 'balance', 'full', 'refund'],
      required: true,
      index: true
    },
    
    // Payment Gateway
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'upi', 'wallet', 'bank_transfer'],
      required: true,
      index: true
    },
    
    // Gateway-specific IDs
    razorpay: {
      orderId: String,
      paymentId: String,
      signatureValid: Boolean
    },
    stripe: {
      paymentIntentId: String,
      chargeId: String,
      clientSecret: String
    },
    
    // Transaction Details
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    
    // Payment Method Details
    paymentMethod: {
      type: {
        type: String,
        enum: ['card', 'upi', 'wallet', 'netbanking', 'bank_transfer']
      },
      cardDetails: {
        last4: String,
        brand: String, // Visa, Mastercard, Amex
        expiryMonth: Number,
        expiryYear: Number,
        issuer: String
      },
      upiId: String,
      walletType: String,
      bankName: String
    },
    
    // Billing Address
    billingAddress: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    
    // Amount Breakdown
    breakdown: {
      baseAmount: Number,
      platformFee: Number,
      gst: Number,
      discount: Number,
      totalAmount: Number
    },
    
    // Refund Information
    refund: {
      status: {
        type: String,
        enum: ['none', 'initiated', 'processing', 'completed', 'failed'],
        default: 'none'
      },
      amount: { type: Number, default: 0 },
      reason: String,
      initiatedAt: Date,
      completedAt: Date,
      refundTransactionId: String,
      refundGatewayResponse: mongoose.Schema.Types.Mixed
    },
    
    // Dispute Information
    dispute: {
      status: {
        type: String,
        enum: ['none', 'raised', 'under_review', 'resolved'],
        default: 'none'
      },
      amount: Number,
      reason: String,
      raisedAt: Date,
      raisedBy: String, // 'customer' or 'gateway'
      evidenceDocument: String,
      resolution: String,
      resolvedAt: Date
    },
    
    // Response from Gateway
    gatewayResponse: mongoose.Schema.Types.Mixed,
    gatewayError: String,
    
    // Metadata
    ipAddress: String,
    userAgent: String,
    attemptNumber: { type: Number, default: 1 },
    failureReason: String,
    
    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
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
PaymentSchema.index({ customerId: 1, createdAt: -1 });
PaymentSchema.index({ vendorId: 1, status: 1 });
PaymentSchema.index({ bookingId: 1, paymentType: 1 });
PaymentSchema.index({ status: 1, gateway: 1 });
PaymentSchema.index({ 'refund.status': 1 });
PaymentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL for audit

// Pre-save middleware
PaymentSchema.pre('save', function (next) {
  if (!this.paymentId) {
    this.paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Methods
PaymentSchema.methods.canBeRefunded = function () {
  return ['completed', 'authorized'].includes(this.status) && this.refund.status === 'none';
};

PaymentSchema.methods.getRefundableAmount = function () {
  return this.amount - this.refund.amount;
};

module.exports = mongoose.model('Payment', PaymentSchema);
