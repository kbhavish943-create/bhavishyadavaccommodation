// src/models/Hall.js
// Hall/Venue Model for Event Bookings

const mongoose = require('mongoose');

const HallSchema = new mongoose.Schema(
  {
    hallId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    
    // Basic Information
    hallName: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    
    // Category
    category: {
      type: String,
      enum: ['marriage_hall', 'birthday_venue', 'corporate_event', 'engagement_venue', 'cocktail_party', 'other'],
      required: true,
      index: true
    },
    
    // Location
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        index: true
      },
      state: {
        type: String,
        trim: true
      },
      pincode: {
        type: String,
        trim: true
      },
      area: {
        type: String,
        trim: true
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: [true, 'Coordinates are required']
        }
      },
      googleMapUrl: String,
      distance: {
        city_center: Number, // km
        airport: Number
      }
    },
    
    // Capacity
    capacity: {
      dining: {
        type: Number,
        required: [true, 'Dining capacity is required']
      },
      standing: Number,
      cocktail: Number,
      theater: Number
    },
    
    // Hall Details
    builtUpArea: Number, // sq ft
    hallType: {
      type: String,
      enum: ['indoor', 'outdoor', 'mixed'],
      default: 'indoor'
    },
    flooring: String,
    height: Number, // feet
    
    // Amenities
    amenities: {
      type: [String],
      default: []
    },
    
    // Policies
    policies: {
      decorationAllowed: { type: Boolean, default: true },
      decorationCost: { type: Number, default: 0 }, // 0 = included
      outsideFoodAllowed: {
        type: String,
        enum: ['yes', 'no', 'partial'],
        default: 'partial'
      },
      outsideFoodCharge: Number,
      outsideDJAllowed: { type: Boolean, default: false },
      outsideDJCharge: Number,
      liquorPolicy: {
        type: String,
        enum: ['allowed', 'not_allowed', 'only_wine'],
        default: 'allowed'
      },
      noiseRestriction: String, // e.g., "11:00 PM"
      minBookingHours: { type: Number, default: 4 },
      setupTime: { type: Number, default: 2 }, // hours
      cleanupTime: { type: Number, default: 1 } // hours
    },
    
    // Availability
    availability: {
      status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
      },
      bookingDays: {
        type: [Number], // 0-6 (Sunday-Saturday)
        default: [0, 1, 2, 3, 4, 5, 6]
      },
      blockedDates: [Date]
    },
    
    // Images & Media
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        order: Number,
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false }
      }
    ],
    videos: [
      {
        url: String,
        publicId: String,
        title: String,
        duration: Number, // seconds
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    coverImage: String,
    
    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: [true, 'Base price is required']
      },
      pricePerPlate: Number,
      weekdayMultiplier: { type: Number, default: 0.8 },
      weekendMultiplier: { type: Number, default: 1.2 },
      festivalMultiplier: { type: Number, default: 1.5 },
      additionalCharges: [
        {
          name: String,
          amount: Number
        }
      ]
    },
    
    // Ratings & Reviews
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: { type: Number, default: 0 },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 }
      }
    },
    
    // Status & Verification
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_approval', 'suspended'],
      default: 'pending_approval',
      index: true
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedAt: Date,
    rejectionReason: String,
    
    // SEO
    seoSlug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true
    },
    metaTitle: String,
    metaDescription: String,
    
    // Analytics
    viewCount: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    
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

// Indexes for better query performance
HallSchema.index({ vendorId: 1 });
HallSchema.index({ city: 1, category: 1 });
HallSchema.index({ 'location.coordinates': '2dsphere' }); // Geo-spatial index
HallSchema.index({ status: 1, approvalStatus: 1 });
HallSchema.index({ seoSlug: 1 });
HallSchema.index({ 'ratings.average': -1 });

// Pre-save middleware to generate hallId and SEO slug
HallSchema.pre('save', function (next) {
  if (!this.hallId) {
    this.hallId = `HALL_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  if (!this.seoSlug) {
    this.seoSlug = this.hallName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  next();
});

module.exports = mongoose.model('Hall', HallSchema);
