// src/models/User.js
// User Model for all user types: Customer, Vendor, Admin

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(v);
        },
        message: 'Invalid phone number format'
      }
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Invalid email format'
      ]
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't return password by default
    },
    userType: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      default: 'customer',
      index: true
    },
    
    // Profile Information
    profilePicture: {
      url: String,
      publicId: String // For Cloudinary deletion
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    
    // Authentication & Verification
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      code: String,
      createdAt: Date,
      expiresAt: Date,
      attempts: { type: Number, default: 0 }
    },
    refreshToken: String,
    
    // Account Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'deleted'],
      default: 'active',
      index: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockReason: String,
    blockDate: Date,
    
    // Notification Preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      pushNotification: { type: Boolean, default: true }
    },
    
    // Language Preference
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en'
    },
    
    // Metadata
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date, // For brute force protection
    
    // Audit
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1, userType: 1 });
UserSchema.index({ phone: 1, userType: 1 });
UserSchema.index({ status: 1, userType: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate userId
UserSchema.pre('save', async function (next) {
  if (!this.userId) {
    const prefix = this.userType === 'vendor' ? 'VENDOR' : 'CUST';
    this.userId = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Virtual for full address
UserSchema.virtual('fullAddress').get(function () {
  if (this.address) {
    return `${this.address.line1}, ${this.address.line2}, ${this.address.city}, ${this.address.state} ${this.address.pincode}`;
  }
  return '';
});

module.exports = mongoose.model('User', UserSchema);
