// src/utils/validators.js
// Input Validation Schemas using Joi

const Joi = require('joi');

// Custom validation messages
const customMessages = {
  'any.required': '{#label} is required',
  'string.empty': '{#label} cannot be empty',
  'string.email': '{#label} must be a valid email',
  'number.min': '{#label} must be at least {#limit}',
  'number.max': '{#label} cannot exceed {#limit}',
  'date.base': '{#label} must be a valid date'
};

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).messages(customMessages),
  email: Joi.string().email().required().messages(customMessages),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a valid 10-digit number',
      'any.required': 'Phone is required'
    }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      'any.required': 'Password is required'
    }),
  userType: Joi.string()
    .valid('customer', 'vendor')
    .default('customer')
    .messages(customMessages),
  address: Joi.object({
    line1: Joi.string(),
    line2: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/)
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages(customMessages),
  password: Joi.string().required().messages(customMessages)
});

const otpVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages(customMessages),
  otp: Joi.string().length(6).pattern(/^[0-9]{6}$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages(customMessages)
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages(customMessages)
});

// ============================================
// VENDOR VALIDATION SCHEMAS
// ============================================

const vendorApplySchema = Joi.object({
  businessName: Joi.string().required().min(3).max(100).messages(customMessages),
  businessType: Joi.string()
    .valid('proprietorship', 'partnership', 'pvt_ltd', 'llp')
    .required()
    .messages(customMessages),
  gstNumber: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).messages({
    'string.pattern.base': 'Invalid GST number format'
  }),
  bankAccount: Joi.object({
    accountHolderName: Joi.string().required().messages(customMessages),
    accountNumber: Joi.string().required().min(9).max(18).messages(customMessages),
    ifscCode: Joi.string().required().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).messages({
      'string.pattern.base': 'Invalid IFSC code format'
    }),
    bankName: Joi.string().required().messages(customMessages)
  }).required()
});

const kycUploadSchema = Joi.object({
  documentType: Joi.string().valid('aadhar', 'pan').required().messages(customMessages),
  documentNumber: Joi.string().required().messages(customMessages),
  frontImage: Joi.any().required().messages({ 'any.required': 'Front image is required' }),
  backImage: Joi.any().messages(customMessages)
});

// ============================================
// HALL VALIDATION SCHEMAS
// ============================================

const hallCreationSchema = Joi.object({
  hallName: Joi.string().required().min(3).max(100).messages(customMessages),
  description: Joi.string().max(5000).messages(customMessages),
  category: Joi.string()
    .valid('marriage_hall', 'birthday_venue', 'corporate_event', 'engagement_venue', 'cocktail_party', 'other')
    .required()
    .messages(customMessages),
  address: Joi.string().required().messages(customMessages),
  city: Joi.string().required().messages(customMessages),
  state: Joi.string().required().messages(customMessages),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
    'string.pattern.base': 'Pincode must be 6 digits'
  }),
  coordinates: Joi.object({
    latitude: Joi.number().required().min(-90).max(90).messages(customMessages),
    longitude: Joi.number().required().min(-180).max(180).messages(customMessages)
  }),
  capacity: Joi.object({
    dining: Joi.number().required().min(10).messages(customMessages),
    standing: Joi.number().min(10),
    cocktail: Joi.number().min(10),
    theater: Joi.number().min(10)
  }).required(),
  basePrice: Joi.number().required().min(1000).messages(customMessages),
  amenities: Joi.array().items(Joi.string()).messages(customMessages),
  policies: Joi.object({
    decorationAllowed: Joi.boolean().required(),
    outsideFoodAllowed: Joi.string().valid('yes', 'no', 'partial'),
    outsideDJAllowed: Joi.boolean().required(),
    liquorPolicy: Joi.string().valid('allowed', 'not_allowed', 'only_wine')
  })
});

const hallUpdateSchema = hallCreationSchema.fork(Object.keys(hallCreationSchema.describe().keys), (schema) =>
  schema.optional()
);

// ============================================
// BOOKING VALIDATION SCHEMAS
// ============================================

const bookingCreationSchema = Joi.object({
  hallId: Joi.string().required().messages(customMessages),
  eventType: Joi.string()
    .valid('marriage', 'birthday', 'corporate', 'engagement', 'anniversary', 'other')
    .required()
    .messages(customMessages),
  eventDate: Joi.date().required().min('now').messages({
    'date.base': 'Event date must be a valid future date',
    'any.required': 'Event date is required'
  }),
  guestCount: Joi.number().required().min(1).messages(customMessages),
  eventTime: Joi.object({
    start: Joi.string().pattern(/^[0-2][0-9]:[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'Start time must be in HH:MM format'
    }),
    end: Joi.string().pattern(/^[0-2][0-9]:[0-5][0-9]$/).required()
  }),
  specialRequirements: Joi.string().max(1000),
  customerDetails: Joi.object({
    name: Joi.string().required().min(2),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    email: Joi.string().email()
  })
});

const bookingCancellationSchema = Joi.object({
  bookingId: Joi.string().required().messages(customMessages),
  reason: Joi.string().required().min(10).max(500).messages(customMessages)
});

// ============================================
// REVIEW VALIDATION SCHEMAS
// ============================================

const reviewCreationSchema = Joi.object({
  hallId: Joi.string().required().messages(customMessages),
  bookingId: Joi.string().required().messages(customMessages),
  overallRating: Joi.number().required().min(1).max(5).messages(customMessages),
  title: Joi.string().required().min(5).max(100).messages(customMessages),
  reviewText: Joi.string().required().min(10).max(2000).messages(customMessages),
  aspectBreakdown: Joi.object({
    venue: Joi.number().min(1).max(5),
    service: Joi.number().min(1).max(5),
    food: Joi.number().min(1).max(5),
    cleanliness: Joi.number().min(1).max(5),
    staff: Joi.number().min(1).max(5),
    parking: Joi.number().min(1).max(5)
  }),
  tags: Joi.array().items(Joi.string()).max(5)
});

// ============================================
// PAYMENT VALIDATION SCHEMAS
// ============================================

const paymentInitiationSchema = Joi.object({
  bookingId: Joi.string().required().messages(customMessages),
  amount: Joi.number().required().min(0).messages(customMessages),
  paymentType: Joi.string().valid('advance', 'balance', 'full').required().messages(customMessages),
  gateway: Joi.string().valid('razorpay', 'stripe', 'upi', 'wallet').required().messages(customMessages)
});

const paymentVerificationSchema = Joi.object({
  paymentId: Joi.string().required(),
  orderId: Joi.string().required(),
  signature: Joi.string().required()
});

// ============================================
// QUERY VALIDATION SCHEMAS
// ============================================

const listingFiltersSchema = Joi.object({
  city: Joi.string(),
  category: Joi.string().valid('marriage_hall', 'birthday_venue', 'corporate_event', 'engagement_venue', 'cocktail_party'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minCapacity: Joi.number().min(1),
  maxCapacity: Joi.number().min(1),
  amenities: Joi.array().items(Joi.string()),
  sortBy: Joi.string().valid('rating', 'price', 'newest', 'popularity'),
  sortOrder: Joi.string().valid('asc', 'desc'),
  page: Joi.number().default(1).min(1),
  limit: Joi.number().default(10).min(1).max(50),
  search: Joi.string().max(100)
});

const paginationSchema = Joi.object({
  page: Joi.number().default(1).min(1).messages(customMessages),
  limit: Joi.number().default(10).min(1).max(100).messages(customMessages)
});

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

module.exports = {
  // Auth
  registerSchema,
  loginSchema,
  otpVerificationSchema,
  refreshTokenSchema,
  resendOtpSchema,

  // Vendor
  vendorApplySchema,
  kycUploadSchema,

  // Hall
  hallCreationSchema,
  hallUpdateSchema,

  // Booking
  bookingCreationSchema,
  bookingCancellationSchema,

  // Review
  reviewCreationSchema,

  // Payment
  paymentInitiationSchema,
  paymentVerificationSchema,

  // Filters
  listingFiltersSchema,
  paginationSchema
};
