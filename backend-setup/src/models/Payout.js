// src/models/Payout.js
// Vendor Earnings and Payouts Model

const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    
    // Payout Period
    periodStart: {
      type: Date,
      required: true,
      index: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    
    // Amount Details
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformCommission: {
      percentage: { type: Number, default: 12 },
      amount: Number
    },
    taxDeducted: {
      type: Number,
      default: 0
    },
    adjustments: [
      {
        description: String,
        amount: Number,
        type: {
          type: String,
          enum: ['deduction', 'addition']
        },
        reason: String
      }
    ],
    netAmount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Payout Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        reason: String
      }
    ],
    
    // Bank Transfer Details
    bankTransfer: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String,
      transferId: String,
      referenceNumber: String,
      initiatedAt: Date,
      completedAt: Date
    },
    
    // Transaction Breakdown
    transactions: [
      {
        bookingId: mongoose.Schema.Types.ObjectId,
        hallId: mongoose.Schema.Types.ObjectId,
        amount: Number,
        commissionDeducted: Number,
        netAmount: Number,
        eventDate: Date
      }
    ],
    
    // Earnings Breakdown
    earnings: {
      totalBookings: Number,
      completedBookings: Number,
      cancelledBookings: Number,
      totalHallRevenue: Number,
      totalAdditionalCharges: Number,
      totalRefunds: Number,
      totalPaymentGatewayFees: Number
    },
    
    // Deductions
    deductions: {
      platformFee: Number,
      cancelledBookingRefunds: Number,
      disputeSettlements: Number,
      penalties: Number
    },
    
    // Additional Info
    remarks: String,
    notes: String,
    
    // Approval
    approval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: mongoose.Schema.Types.ObjectId,
      approvedAt: Date,
      rejectionReason: String
    },
    
    // Audit Trail
    requestedAt: { type: Date, default: Date.now },
    requestedBy: String, // 'system' or admin userId
    processedBy: mongoose.Schema.Types.ObjectId,
    processedAt: Date,
    
    // Timestamps
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
PayoutSchema.index({ vendorId: 1, periodStart: -1 });
PayoutSchema.index({ vendorId: 1, status: 1 });
PayoutSchema.index({ status: 1, createdAt: -1 });
PayoutSchema.index({ periodStart: 1, periodEnd: 1 });

// Pre-save middleware
PayoutSchema.pre('save', function (next) {
  if (!this.payoutId) {
    this.payoutId = `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Calculate net amount if not already set
  if (this.grossAmount && this.platformCommission) {
    this.netAmount = this.grossAmount - (this.platformCommission.amount || 0) - (this.taxDeducted || 0);
  }
  
  next();
});

// Methods
PayoutSchema.methods.getPendingAmount = function () {
  return this.status === 'pending' ? this.netAmount : 0;
};

PayoutSchema.methods.getCompletedAmount = function () {
  return this.status === 'completed' ? this.netAmount : 0;
};

module.exports = mongoose.model('Payout', PayoutSchema);
