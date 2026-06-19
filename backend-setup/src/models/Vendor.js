// src/models/Vendor.js
// Vendor Profile Model

const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    
    // KYC Information
    kycStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    
    // Aadhar Verification
    aadhar: {
      number: {
        type: String,
        trim: true
      },
      documentUrl: String,
      documentPublicId: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    
    // PAN Verification
    pan: {
      number: {
        type: String,
        trim: true,
        uppercase: true
      },
      documentUrl: String,
      documentPublicId: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    
    // Business Details
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    businessType: {
      type: String,
      enum: ['proprietorship', 'partnership', 'pvt_ltd', 'llp'],
      default: 'proprietorship'
    },
    gstNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    gstRegistered: { type: Boolean, default: false },
    
    // Bank Account for Payouts
    bankAccount: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountType: {
        type: String,
        enum: ['savings', 'current'],
        default: 'savings'
      },
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    
    // Commission & Earnings
    commissionPercentage: {
      type: Number,
      default: 12, // 12% default
      min: 0,
      max: 100
    },
    payoutFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly'
    },
    nextPayoutDate: Date,
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPayouts: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingPayout: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Performance Metrics
    totalHalls: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalCompletedBookings: { type: Number, default: 0 },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: { type: Number, default: 0 },
    responseTime: { type: Number, default: null }, // in minutes
    responseRate: { type: Number, default: 100 }, // percentage
    cancellationRate: { type: Number, default: 0 }, // percentage
    
    // Verification Badges
    verifiedBadge: { type: Boolean, default: false },
    qualityBadge: { type: Boolean, default: false }, // High-quality listings
    responsiveBadge: { type: Boolean, default: false }, // Responds quickly
    
    // Account Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'banned'],
      default: 'active',
      index: true
    },
    suspensionReason: String,
    suspensionDate: Date,
    warningCount: { type: Number, default: 0 },
    warnings: [
      {
        reason: String,
        issuedAt: Date,
        issuedBy: mongoose.Schema.Types.ObjectId
      }
    ],
    
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
VendorSchema.index({ userId: 1 });
VendorSchema.index({ kycStatus: 1 });
VendorSchema.index({ status: 1 });
VendorSchema.index({ averageRating: -1 });
VendorSchema.index({ totalEarnings: -1 });

module.exports = mongoose.model('Vendor', VendorSchema);
