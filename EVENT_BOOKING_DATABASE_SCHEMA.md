# Event Booking Platform - Complete Database Schema

## 📊 Database Design

**Database Type:** MongoDB (NoSQL) - Recommended for flexibility  
**Alternative:** MySQL for relational approach  
**Version:** 1.0

---

## 🗂️ COLLECTIONS (MongoDB) / TABLES (MySQL)

### 1️⃣ USERS Collection

Stores all three user types: Customer, Vendor, Admin

```javascript
db.users.insertOne({
  _id: ObjectId,
  userId: "CUST_001",           // Unique ID
  phone: "+919876543210",
  email: "user@example.com",
  name: "John Doe",
  password: "hashed_password",
  userType: "customer",         // "customer" | "vendor" | "admin"
  
  // Authentication
  isPhoneVerified: true,
  isEmailVerified: true,
  otp: null,
  otpExpiry: null,
  refreshToken: "token_string",
  
  // Profile
  profilePicture: "url_to_image",
  address: {
    line1: "123 Street",
    line2: "Apt 4",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India"
  },
  
  // Preferences
  language: "en",               // "en" | "hi"
  notificationPreferences: {
    email: true,
    sms: true,
    whatsapp: true,
    pushNotification: true
  },
  
  // Account Status
  status: "active",             // "active" | "inactive" | "suspended"
  isBlocked: false,
  blockReason: null,
  
  // Metadata
  createdAt: ISODate(),
  updatedAt: ISODate(),
  lastLogin: ISODate(),
  deletedAt: null
})
```

### 2️⃣ VENDORS Collection

Vendor-specific information (extends Users)

```javascript
db.vendors.insertOne({
  _id: ObjectId,
  userId: "VENDOR_001",
  vendorId: "VEND_001",
  
  // KYC & Verification
  kycStatus: "verified",        // "pending" | "verified" | "rejected"
  aadharNumber: "xxxx_xxxx_1234",
  panNumber: "ABCD1234E",
  aadharVerified: true,
  panVerified: true,
  
  // Documents
  documents: [
    {
      type: "aadhar",           // "aadhar" | "pan" | "addressProof" | "ownershipProof"
      url: "document_url",
      uploadedAt: ISODate(),
      verified: true
    }
  ],
  
  // Business Details
  businessName: "Grand Hall Events",
  businessType: "proprietorship", // "proprietorship" | "partnership" | "pvt_ltd"
  gstNumber: "27AABCT1234A1Z0",
  gstRegistered: true,
  
  // Bank Details
  bankAccount: {
    accountHolderName: "John Doe",
    accountNumber: "xxxx_xxxx_1234",
    ifscCode: "HDFC0000001",
    bankName: "HDFC Bank",
    verificationStatus: "verified"
  },
  
  // Commission & Payout
  commissionPercentage: 12,     // Platform takes 12%
  payoutFrequency: "weekly",    // "weekly" | "monthly"
  nextPayoutDate: ISODate(),
  totalEarnings: 150000,
  totalPayouts: 145000,
  pendingPayout: 5000,
  
  // Ratings
  averageRating: 4.7,
  totalReviews: 45,
  responseTime: 120,            // in minutes
  
  // Status
  verifiedBadge: true,
  suspensionReason: null,
  warningCount: 0,
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 3️⃣ HALLS Collection

All venue/hall information

```javascript
db.halls.insertOne({
  _id: ObjectId,
  hallId: "HALL_001",
  vendorId: "VENDOR_001",
  
  // Basic Info
  hallName: "Grand Ballroom Palace",
  category: "marriage_hall",    // "marriage_hall" | "birthday_venue" | "corporate" | etc
  description: "Luxurious hall with crystal chandeliers...",
  
  // Location
  location: {
    address: "123 Ring Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    area: "Andheri",
    coordinates: {
      type: "Point",
      coordinates: [72.8479, 19.1136]  // [longitude, latitude]
    },
    googleMapUrl: "https://maps.google.com/...",
    distance: {
      city_center: 5,           // km
      airport: 15
    }
  },
  
  // Capacity
  capacity: {
    dining: 500,                // seated dining
    standing: 700,
    cocktail: 800,
    theater: 1000
  },
  
  // Hall Details
  builtUpArea: 5000,            // sq ft
  hallType: "indoor",           // "indoor" | "outdoor" | "mixed"
  flooring: "marble",           // "marble" | "wooden" | "ceramic"
  height: 20,                   // feet
  
  // Amenities
  amenities: [
    "AC",
    "Parking",
    "WiFi",
    "Kitchen",
    "Washrooms",
    "Wheelchair Accessible"
  ],
  
  // Policies
  policies: {
    decorationAllowed: true,
    decorationCost: 0,          // 0 = included
    outsideFoodAllowed: "partial", // "yes" | "no" | "partial"
    outsideFoodCharge: 500,     // per head if partial
    outsideDJAllowed: false,
    outsideDJCharge: 5000,
    liquorPolicy: "allowed",    // "allowed" | "not_allowed" | "only_wine"
    noiseRestriction: "11:00 PM",
    minBookingHours: 4,
    setupTime: 2,               // hours included
    cleanupTime: 1              // hours included
  },
  
  // Availability
  availability: {
    status: "active",           // "active" | "inactive" | "maintenance"
    bookingDays: [1,2,3,4,5,6,0], // day of week
    blockedDates: [
      ISODate("2024-02-14"),
      ISODate("2024-12-25")
    ]
  },
  
  // Images & Media
  images: [
    {
      url: "image_url",
      caption: "Main hall with decorations",
      order: 1,
      uploadedAt: ISODate(),
      verified: true
    }
  ],
  videos: [
    {
      url: "video_url",
      title: "Hall walkthrough",
      duration: 180,            // seconds
      uploadedAt: ISODate()
    }
  ],
  coverImage: "image_url",
  
  // Pricing
  pricing: {
    basePrice: 50000,           // base price for the event
    pricePerPlate: 800,         // catering cost per plate
    weekdayMultiplier: 0.8,     // 20% discount on weekdays
    weekendMultiplier: 1.2,     // 20% premium on weekends
    festivalMultiplier: 1.5,    // 50% premium on festivals
    additionalCharges: [
      {
        name: "Valet Parking",
        amount: 5000
      }
    ]
  },
  
  // Ratings & Reviews
  ratings: {
    average: 4.7,
    count: 45,
    breakdown: {
      5: 30,
      4: 12,
      3: 2,
      2: 1,
      1: 0
    }
  },
  
  // Status & Verification
  status: "active",             // "active" | "inactive" | "pending_approval" | "suspended"
  approvalStatus: "approved",   // "pending" | "approved" | "rejected"
  approvedBy: "ADMIN_001",
  approvedAt: ISODate(),
  rejectionReason: null,
  
  // SEO
  seoSlug: "grand-ballroom-palace-mumbai",
  metaTitle: "Grand Ballroom Palace - Mumbai Marriage Hall",
  metaDescription: "Luxury marriage hall in Mumbai with 500+ capacity...",
  
  createdAt: ISODate(),
  updatedAt: ISODate(),
  viewCount: 5000
})
```

### 4️⃣ MENUS Collection

Food menus for each hall

```javascript
db.menus.insertOne({
  _id: ObjectId,
  menuId: "MENU_001",
  hallId: "HALL_001",
  
  menuType: "veg",              // "veg" | "non_veg" | "vegan"
  menuName: "Premium Vegetarian",
  pricePerPlate: 800,
  
  // Courses
  courses: [
    {
      course: "starter",
      items: [
        { name: "Paneer Tikka", veg: true },
        { name: "Cheese Ball", veg: true }
      ]
    },
    {
      course: "main",
      items: [
        { name: "Paneer Butter Masala", veg: true },
        { name: "Dal Makhani", veg: true }
      ]
    },
    {
      course: "bread",
      items: [
        { name: "Naan", veg: true },
        { name: "Roti", veg: true }
      ]
    },
    {
      course: "dessert",
      items: [
        { name: "Gulab Jamun", veg: true },
        { name: "Kheer", veg: true }
      ]
    }
  ],
  
  // Customization
  canCustomize: true,
  minimumGuests: 100,
  
  status: "active",
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 5️⃣ BOOKINGS Collection

All booking records

```javascript
db.bookings.insertOne({
  _id: ObjectId,
  bookingId: "BOOK_001",
  customerId: "CUSTOMER_001",
  hallId: "HALL_001",
  vendorId: "VENDOR_001",
  
  // Event Details
  eventType: "marriage",        // "marriage" | "birthday" | "engagement" | etc
  eventDate: ISODate("2024-02-14"),
  guestCount: 250,
  
  // Time Details
  eventTime: {
    start: "18:00",
    end: "23:00"
  },
  setupTime: "17:00",
  cleanupTime: "23:00 - 00:00",
  
  // Pricing
  pricing: {
    hallPrice: 50000,
    cateringPrice: 200000,      // 250 guests * 800 per plate
    additionalCharges: 5000,
    subtotal: 255000,
    platformFee: 2500,
    gst: 45900,                 // 18% GST
    totalAmount: 303400,
    discountAmount: 0,
    finalAmount: 303400
  },
  
  // Payment
  payment: {
    status: "completed",        // "pending" | "completed" | "failed" | "refunded"
    method: "razorpay",         // "razorpay" | "stripe" | "upi" | "wallet"
    transactionId: "TXN_001",
    orderId: "ORD_001",
    paymentDate: ISODate(),
    paidAmount: 303400,
    refundedAmount: 0,
    refundDate: null,
    refundReason: null
  },
  
  // Advance Booking
  advancePayment: {
    percentage: 50,
    amount: 151700,
    paidDate: ISODate(),
    status: "paid"
  },
  
  // Status
  bookingStatus: "confirmed",   // "pending" | "confirmed" | "completed" | "cancelled"
  statusHistory: [
    {
      status: "pending",
      changedAt: ISODate(),
      changedBy: "system"
    },
    {
      status: "confirmed",
      changedAt: ISODate(),
      changedBy: "vendor"
    }
  ],
  
  // Customer Details
  customerName: "Raj Kumar",
  customerPhone: "+919876543210",
  customerEmail: "raj@example.com",
  
  // Special Requirements
  specialRequirements: "Need vegetarian menu only",
  colorTheme: "Gold and White",
  
  // Cancellation
  cancellation: {
    status: null,
    requestedAt: null,
    refundPercentage: 50,       // Policy-based
    reason: null
  },
  
  // Modifications
  modifications: [
    {
      type: "guest_count_change",
      oldValue: 300,
      newValue: 250,
      changedAt: ISODate(),
      changedBy: "customer"
    }
  ],
  
  // Confirmations
  confirmations: {
    vendorConfirmed: true,
    customerConfirmed: true,
    guestCountConfirmed: true,
    menuConfirmed: true,
    paymentConfirmed: true
  },
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 6️⃣ REVIEWS Collection

Customer reviews and ratings

```javascript
db.reviews.insertOne({
  _id: ObjectId,
  reviewId: "REV_001",
  bookingId: "BOOK_001",
  hallId: "HALL_001",
  customerId: "CUSTOMER_001",
  vendorId: "VENDOR_001",
  
  // Rating
  rating: 4.5,                  // 1-5 stars
  
  // Review Content
  title: "Amazing hall, great service!",
  reviewText: "Had my wedding here and it was perfect...",
  
  // Review Aspects
  ratingBreakdown: {
    cleanliness: 5,
    service: 4,
    ambiance: 5,
    valueForMoney: 4,
    staff: 4,
    food: 4,
    punctuality: 5
  },
  
  // Media
  photos: [
    {
      url: "photo_url",
      caption: "Decorated main hall",
      uploadedAt: ISODate()
    }
  ],
  
  // Verification
  isVerifiedBooking: true,      // Booked from platform
  eventDate: ISODate("2024-02-14"),
  reviewDate: ISODate("2024-02-15"),
  
  // Vendor Response
  vendorResponse: {
    replied: true,
    responseText: "Thank you for the wonderful review!",
    respondedAt: ISODate()
  },
  
  // Moderation
  status: "approved",           // "pending" | "approved" | "rejected"
  approvedAt: ISODate(),
  approvedBy: "ADMIN_001",
  
  // Helpfulness
  helpfulCount: 12,
  notHelpfulCount: 1,
  
  // Visibility
  isVisible: true,
  visibilityScore: 95,          // Algorithm-based
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 7️⃣ PAYMENTS Collection

Detailed payment transaction log

```javascript
db.payments.insertOne({
  _id: ObjectId,
  paymentId: "PAY_001",
  bookingId: "BOOK_001",
  customerId: "CUSTOMER_001",
  vendorId: "VENDOR_001",
  
  // Payment Details
  amount: 303400,
  currency: "INR",
  paymentGateway: "razorpay",   // "razorpay" | "stripe" | "upi"
  paymentMethod: "credit_card",  // "credit_card" | "debit_card" | "upi" | "wallet" | "emi"
  
  // Transaction IDs
  orderId: "ORD_001",
  transactionId: "TXN_001",
  referenceId: "REF_001",
  
  // Gateway Response
  gatewayResponse: {
    status: "success",
    code: "200",
    message: "Payment successful",
    gatewayTransactionId: "razorpay_pay_123456"
  },
  
  // Payment Status
  status: "completed",          // "pending" | "processing" | "completed" | "failed" | "refunded"
  attemptCount: 1,
  failureReason: null,
  
  // Timestamps
  initiatedAt: ISODate(),
  processedAt: ISODate(),
  
  // Refund (if applicable)
  refund: {
    status: null,               // "pending" | "processed" | "failed"
    amount: null,
    reason: null,
    initiatedAt: null,
    processedAt: null,
    refundId: null
  },
  
  // EMI (if applicable)
  emi: {
    enabled: false,
    months: null,
    monthlyAmount: null
  },
  
  // Verification
  signature: "payment_signature",
  signatureVerified: true,
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 8️⃣ PAYOUTS Collection

Vendor earnings and payout records

```javascript
db.payouts.insertOne({
  _id: ObjectId,
  payoutId: "PAYOUT_001",
  vendorId: "VENDOR_001",
  
  // Payout Details
  amount: 50000,
  periodStart: ISODate("2024-01-01"),
  periodEnd: ISODate("2024-01-07"),
  payoutDate: ISODate("2024-01-08"),
  
  // Breakdown
  breakdown: {
    bookingRevenue: 45000,
    previousBalance: 5000,
    deductions: 0,
    gst: 0,
    netAmount: 50000
  },
  
  // Transaction
  transactionId: "TXN_PAYOUT_001",
  bankTransferId: "NEFT_001",
  status: "completed",          // "pending" | "processing" | "completed" | "failed"
  
  // Bank Details
  bankAccount: {
    accountNumber: "xxxx_xxxx_1234",
    ifscCode: "HDFC0000001",
    accountHolderName: "John Doe"
  },
  
  // Failure Handling
  failureReason: null,
  retryCount: 0,
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 9️⃣ DISPUTES Collection

Booking disputes and conflicts

```javascript
db.disputes.insertOne({
  _id: ObjectId,
  disputeId: "DISP_001",
  bookingId: "BOOK_001",
  customerId: "CUSTOMER_001",
  vendorId: "VENDOR_001",
  
  // Dispute Details
  subject: "Hall was not as shown in photos",
  description: "The decorated hall was very different from the sample photos...",
  
  // Evidence
  attachments: [
    {
      type: "photo",
      url: "photo_url",
      uploadedAt: ISODate(),
      uploadedBy: "customer"
    }
  ],
  
  // Timeline
  raisedAt: ISODate(),
  raisedBy: "customer",
  
  // Responses
  responses: [
    {
      respondedBy: "vendor",
      message: "We can offer 10% refund as compensation...",
      respondedAt: ISODate()
    }
  ],
  
  // Resolution
  status: "resolved",           // "open" | "in_progress" | "resolved" | "closed"
  resolution: {
    refundPercentage: 15,
    refundAmount: 45510,
    decisionMakerType: "admin", // "admin" | "mutual_agreement"
    decidedAt: ISODate(),
    decidedBy: "ADMIN_001",
    reason: "Valid complaint about hall condition"
  },
  
  // Escalation
  escalated: false,
  escalationReason: null,
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 🔟 CHATS Collection

Real-time messaging between customers and vendors

```javascript
db.chats.insertOne({
  _id: ObjectId,
  chatId: "CHAT_001",
  participantOne: "CUSTOMER_001",
  participantTwo: "VENDOR_001",
  bookingId: "BOOK_001",
  
  messages: [
    {
      messageId: "MSG_001",
      senderId: "CUSTOMER_001",
      senderType: "customer",
      message: "Hi, can we customize the menu?",
      timestamp: ISODate(),
      readAt: ISODate(),
      type: "text"              // "text" | "image" | "file"
    },
    {
      messageId: "MSG_002",
      senderId: "VENDOR_001",
      senderType: "vendor",
      message: "Yes, we can customize!",
      timestamp: ISODate(),
      readAt: null,
      type: "text"
    }
  ],
  
  lastMessage: {
    text: "Yes, we can customize!",
    senderId: "VENDOR_001",
    timestamp: ISODate()
  },
  
  status: "active",             // "active" | "archived" | "closed"
  
  createdAt: ISODate(),
  updatedAt: ISODate()
})
```

### 1️⃣1️⃣ WISHLISTS Collection

Customer saved favorite halls

```javascript
db.wishlists.insertOne({
  _id: ObjectId,
  wishlistId: "WISH_001",
  customerId: "CUSTOMER_001",
  
  items: [
    {
      hallId: "HALL_001",
      addedAt: ISODate(),
      notes: "For my sister's wedding"
    },
    {
      hallId: "HALL_002",
      addedAt: ISODate(),
      notes: null
    }
  ],
  
  totalItems: 5,
  lastUpdated: ISODate(),
  
  createdAt: ISODate()
})
```

### 1️⃣2️⃣ NOTIFICATIONS Collection

User notifications

```javascript
db.notifications.insertOne({
  _id: ObjectId,
  notificationId: "NOTIF_001",
  userId: "CUSTOMER_001",
  
  type: "booking_confirmed",    // "booking_confirmed" | "payment_received" | "review_reply" | etc
  title: "Booking Confirmed",
  message: "Your booking for Grand Ballroom has been confirmed!",
  
  // Metadata
  relatedId: "BOOK_001",
  relatedType: "booking",
  
  // Channels
  channels: {
    inApp: true,
    email: true,
    sms: false,
    whatsapp: true,
    push: true
  },
  
  // Delivery Status
  deliveryStatus: {
    inApp: { sent: true, readAt: ISODate() },
    email: { sent: true, openedAt: ISODate() },
    sms: { sent: false, failureReason: null },
    whatsapp: { sent: true, deliveredAt: ISODate() },
    push: { sent: true, openedAt: null }
  },
  
  priority: "high",             // "low" | "medium" | "high"
  action: {
    type: "view_booking",
    url: "/bookings/BOOK_001"
  },
  
  status: "read",               // "unread" | "read"
  readAt: ISODate(),
  
  expiresAt: ISODate("2024-01-20"),
  
  createdAt: ISODate()
})
```

### 1️⃣3️⃣ ADMIN SETTINGS Collection

Platform-wide configurations

```javascript
db.adminSettings.insertOne({
  _id: ObjectId,
  settingId: "SETTINGS_001",
  
  // Commission
  commission: {
    default: 12,                // 12% of booking
    byCategory: {
      marriage_hall: 12,
      birthday_venue: 10,
      corporate: 15
    }
  },
  
  // Taxes
  tax: {
    gstPercentage: 18,
    platformTaxPercentage: 2
  },
  
  // Payment Gateways
  paymentGateways: {
    razorpay: {
      enabled: true,
      keyId: "razorpay_key_id",
      keySecret: "encrypted_secret"
    },
    stripe: {
      enabled: true,
      secretKey: "encrypted_key"
    }
  },
  
  // Feature Toggles
  features: {
    virtualTour: false,
    videoReviews: true,
    videoCall: true,
    aiRecommendations: false,
    mobileApp: false
  },
  
  // Policies
  policies: {
    cancellationDeadline: 7,    // days before event
    maxModificationCount: 3,    // per booking
    reviewPostingDelay: 1       // days after event
  },
  
  updatedAt: ISODate(),
  updatedBy: "ADMIN_001"
})
```

### 1️⃣4️⃣ AUDIT LOGS Collection

Track all important actions

```javascript
db.auditLogs.insertOne({
  _id: ObjectId,
  logId: "LOG_001",
  
  action: "booking_created",    // "booking_created" | "payment_processed" | "hall_approved" | etc
  actionBy: "CUSTOMER_001",
  actionType: "customer",       // "customer" | "vendor" | "admin" | "system"
  
  // Details
  details: {
    bookingId: "BOOK_001",
    hallId: "HALL_001",
    amount: 303400
  },
  
  // Changes
  changes: {
    oldValue: null,
    newValue: "confirmed"
  },
  
  // IP & Device
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  
  status: "success",            // "success" | "failed"
  failureReason: null,
  
  createdAt: ISODate()
})
```

---

## 🔗 RELATIONSHIPS & INDEXES

### Index Strategy (For Performance)

```javascript
// Users
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ userType: 1 })
db.users.createIndex({ status: 1 })

// Vendors
db.vendors.createIndex({ vendorId: 1 }, { unique: true })
db.vendors.createIndex({ kycStatus: 1 })

// Halls
db.halls.createIndex({ hallId: 1 }, { unique: true })
db.halls.createIndex({ vendorId: 1 })
db.halls.createIndex({ category: 1 })
db.halls.createIndex({ "location.coordinates": "2dsphere" })  // Geo-spatial
db.halls.createIndex({ city: 1, category: 1 })  // Compound index
db.halls.createIndex({ status: 1, approvalStatus: 1 })
db.halls.createIndex({ seoSlug: 1 }, { unique: true })

// Bookings
db.bookings.createIndex({ bookingId: 1 }, { unique: true })
db.bookings.createIndex({ customerId: 1 })
db.bookings.createIndex({ hallId: 1 })
db.bookings.createIndex({ vendorId: 1 })
db.bookings.createIndex({ eventDate: 1 })
db.bookings.createIndex({ bookingStatus: 1 })
db.bookings.createIndex({ hallId: 1, eventDate: 1 })  // For availability search

// Reviews
db.reviews.createIndex({ hallId: 1 })
db.reviews.createIndex({ customerId: 1 })
db.reviews.createIndex({ status: 1 })
db.reviews.createIndex({ rating: -1 })

// Payments
db.payments.createIndex({ paymentId: 1 }, { unique: true })
db.payments.createIndex({ bookingId: 1 })
db.payments.createIndex({ transactionId: 1 }, { unique: true })
db.payments.createIndex({ status: 1 })

// Payouts
db.payouts.createIndex({ payoutId: 1 }, { unique: true })
db.payouts.createIndex({ vendorId: 1 })
db.payouts.createIndex({ status: 1 })

// Chats
db.chats.createIndex({ participantOne: 1, participantTwo: 1 }, { unique: true })
db.chats.createIndex({ bookingId: 1 })

// Notifications
db.notifications.createIndex({ userId: 1 })
db.notifications.createIndex({ status: 1 })
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })  // Auto-delete after 30 days
```

---

## 📊 DATA VOLUME ESTIMATES

| Collection | Records | Size |
|-----------|---------|------|
| Users | 100,000 | 50 MB |
| Vendors | 5,000 | 15 MB |
| Halls | 15,000 | 100 MB |
| Bookings | 50,000 | 80 MB |
| Reviews | 100,000 | 50 MB |
| Payments | 50,000 | 40 MB |
| Chats | 500,000 | 300 MB |
| Notifications | 500,000 | 100 MB |
| **Total** | **1.2M** | **~735 MB** |

---

## 🔐 Data Validation Rules

### Users
- Phone: Valid Indian format (+91XXXXXXXXXX)
- Email: Valid email format
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Name: Min 2 chars, max 100 chars

### Vendors
- Aadhar: 12 digits
- PAN: 10 alphanumeric
- Bank Account: 9-18 digits

### Halls
- Hall Name: Min 3 chars, max 100
- Capacity: dining > 0, standing >= dining
- Price: > 0

### Bookings
- Event Date: Must be in future
- Guest Count: > 0, <= hall capacity
- Total Amount: > 0

### Reviews
- Rating: 1-5 stars
- Review Text: Min 10 chars, max 5000
- Photos: Max 5 images, max 10MB each

---

## 🚀 Migration Path (From Hotel System)

```
OLD                          →    NEW
hotels                       →    halls
managers                     →    vendors
customers                    →    customers (same)
bookings                     →    bookings (extended)
rooms                        →    (removed, integrated into halls)
```

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Database:** MongoDB 5.0+  
**Status:** ✅ Ready for Implementation

