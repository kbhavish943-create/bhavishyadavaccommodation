// src/models/Review.js
// Customer Reviews and Ratings Model

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: [true, 'Hall ID is required'],
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    
    // Overall Rating
    overallRating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      index: true
    },
    
    // Aspect-wise Ratings (each 1-5)
    aspectBreakdown: {
      venue: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
      },
      service: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
      },
      food: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
      },
      staff: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
      },
      parking: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
      }
    },
    
    // Review Content
    title: {
      type: String,
      required: [true, 'Review title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
      minlength: [10, 'Review must be at least 10 characters']
    },
    
    // Media
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    videos: [
      {
        url: String,
        publicId: String,
        duration: Number
      }
    ],
    
    // Tags
    tags: [String], // e.g., 'good_parking', 'excellent_staff', 'clean_venue'
    
    // Moderation
    moderation: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
      },
      moderatedBy: mongoose.Schema.Types.ObjectId,
      moderatedAt: Date,
      rejectionReason: String
    },
    
    // Vendor Response
    vendorResponse: {
      text: String,
      respondedAt: Date,
      respondedBy: mongoose.Schema.Types.ObjectId
    },
    
    // Flags
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    },
    isFlaggedAsInappropriate: {
      type: Boolean,
      default: false
    },
    flagReasons: [String],
    isHelpful: {
      count: { type: Number, default: 0 },
      userIds: [mongoose.Schema.Types.ObjectId]
    },
    isNotHelpful: {
      count: { type: Number, default: 0 },
      userIds: [mongoose.Schema.Types.ObjectId]
    },
    
    // SEO
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    
    // Timestamps
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
ReviewSchema.index({ hallId: 1, createdAt: -1 });
ReviewSchema.index({ vendorId: 1, 'moderation.status': 1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ overallRating: 1, createdAt: -1 });

// Pre-save middleware
ReviewSchema.pre('save', function (next) {
  if (!this.reviewId) {
    this.reviewId = `REV_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Method to calculate helpfulness percentage
ReviewSchema.methods.getHelpfulnessPercentage = function () {
  const total = this.isHelpful.count + this.isNotHelpful.count;
  if (total === 0) return 0;
  return Math.round((this.isHelpful.count / total) * 100);
};

module.exports = mongoose.model('Review', ReviewSchema);

