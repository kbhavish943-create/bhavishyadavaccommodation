# Multi-Service Platform - Backend Implementation Guide

## 📁 Recommended Backend Structure

```
server/
├── config/
│   ├── database.js
│   ├── payment-gateways.js
│   ├── email.js
│   ├── sms.js
│   └── constants.js
│
├── middleware/
│   ├── auth.js (updated for multi-role)
│   ├── errorHandler.js
│   ├── validation.js
│   ├── rateLimit.js
│   └── corsConfig.js
│
├── routes/
│   ├── auth.js (customer + vendor + admin)
│   ├── services.js (service listing, search, filter)
│   ├── bookings.js (create, manage, update)
│   ├── payments.js (payment processing)
│   ├── reviews.js (ratings and reviews)
│   ├── vendors.js (vendor management)
│   ├── admin.js (admin operations)
│   ├── wishlists.js
│   └── notifications.js
│
├── controllers/
│   ├── authController.js
│   ├── serviceController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── reviewController.js
│   ├── vendorController.js
│   ├── customerController.js
│   ├── adminController.js
│   └── notificationController.js
│
├── services/
│   ├── authService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   ├── emailService.js
│   ├── smsService.js
│   ├── searchService.js
│   ├── analyticsService.js
│   └── payoutService.js
│
├── models/
│   ├── User.js
│   ├── Vendor.js
│   ├── Service.js
│   ├── Booking.js
│   ├── Payment.js
│   ├── Review.js
│   └── Availability.js
│
├── utils/
│   ├── validators.js
│   ├── helpers.js
│   ├── paymentHelper.js
│   ├── bookingHelper.js
│   └── dateUtils.js
│
├── jobs/
│   ├── notificationQueue.js
│   ├── payoutQueue.js
│   ├── reportQueue.js
│   └── cleanupQueue.js
│
├── webhooks/
│   ├── razorpayWebhook.js
│   ├── stripeWebhook.js
│   └── smsWebhook.js
│
└── index.js
```

---

## 🔑 Key API Controllers

### 1. Service Discovery Controller

```javascript
// GET /api/services - Get all services with filters
exports.getServices = async (req, res) => {
  const { 
    category,           // hotels, marriage-halls, etc
    city,
    priceMin,
    priceMax,
    rating,
    capacity,
    search,
    sortBy,             // 'popularity', 'price', 'rating'
    page = 1,
    limit = 20
  } = req.query;
  
  // Build query with filters
  // Apply pagination
  // Sort results
  // Return with vendor details, images, reviews
};

// GET /api/services/:id - Get service details
exports.getServiceById = async (req, res) => {
  // Get service info
  // Get vendor details
  // Get availability
  // Get reviews
  // Get similar services
  // Track view count
};

// GET /api/vendors/:id - Get vendor profile
exports.getVendorProfile = async (req, res) => {
  // Vendor info
  // All services
  // Reviews & rating
  // Response time
  // Years in business
};

// GET /api/services/:id/availability - Check availability
exports.checkAvailability = async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  // Query availability_slots table
  // Show available time slots
  // Show pricing for each slot
};
```

### 2. Booking Controller

```javascript
// POST /api/bookings - Create booking
exports.createBooking = async (req, res) => {
  const {
    serviceId,
    bookingDate,
    guestCount,
    specialRequests,
    customizations = {}
  } = req.body;
  
  // Validate service exists
  // Check availability
  // Calculate total amount (base price + customizations + taxes)
  // Create booking record
  // Send confirmation email
  // Return booking reference
};

// GET /api/my-bookings - Get customer's bookings
exports.getMyBookings = async (req, res) => {
  const customerId = req.user.id;
  
  // Fetch all bookings for customer
  // Group by status: upcoming, completed, cancelled
  // Include vendor details, service details
  // Include payment status
};

// PATCH /api/bookings/:id - Update booking
exports.updateBooking = async (req, res) => {
  // Allow changes only if status is 'pending'
  // Recalculate amount if dates/guests changed
  // Send update notification
};

// POST /api/bookings/:id/cancel - Cancel booking
exports.cancelBooking = async (req, res) => {
  // Check cancellation policy
  // Calculate refund amount
  // Create refund transaction
  // Update booking status
  // Notify vendor & customer
};

// POST /api/bookings/:id/reschedule - Reschedule
exports.rescheduleBooking = async (req, res) => {
  const { newBookingDate } = req.body;
  
  // Check new availability
  // Recalculate amount if needed
  // Update booking
  // Notify vendor
};
```

### 3. Vendor Dashboard Controller

```javascript
// GET /api/vendor/dashboard - Vendor stats
exports.getVendorDashboard = async (req, res) => {
  const vendorId = req.user.vendorId;
  
  return {
    stats: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      pendingPayouts,
      averageRating,
      totalReviews,
      responseTime
    },
    recentBookings: [],
    upcomingBookings: [],
    revenue_trend: [],      // Last 30 days
    top_services: [],
    customer_feedback: []
  };
};

// GET /api/vendor/bookings - Vendor's bookings
exports.getVendorBookings = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { status, dateFrom, dateTo } = req.query;
  
  // Fetch bookings
  // Filter by status and date range
  // Show customer contact info
  // Show payment status
};

// POST /api/vendor/services - Create new service
exports.createService = async (req, res) => {
  const vendorId = req.user.vendorId;
  const {
    serviceType,
    title,
    description,
    basePrice,
    capacity,
    amenities,
    images,
    rules
  } = req.body;
  
  // Validate input
  // Upload images to S3/Cloudinary
  // Create service record
};

// POST /api/vendor/availability - Set availability
exports.setAvailability = async (req, res) => {
  const vendorId = req.user.vendorId;
  const {
    serviceId,
    dates,              // Array of available dates
    startTime,
    endTime,
    maxBookingsPerSlot,
    price
  } = req.body;
  
  // Create availability slots
  // Check for conflicts
};

// GET /api/vendor/payouts - Payout history
exports.getPayoutHistory = async (req, res) => {
  const vendorId = req.user.vendorId;
  
  // Fetch vendor_payouts
  // Show status: pending, processing, completed
  // Show amounts and dates
};
```

### 4. Review Controller

```javascript
// POST /api/reviews - Add review
exports.addReview = async (req, res) => {
  const customerId = req.user.id;
  const {
    bookingId,
    rating,
    title,
    reviewText,
    photos,
    serviceRating,
    cleanlinessRating,
    valueRating,
    staffRating
  } = req.body;
  
  // Verify booking exists and is completed
  // Verify customer is the one who booked
  // Create review
  // Update vendor rating
  // Notify vendor
};

// GET /api/vendor/:id/reviews - Get vendor reviews
exports.getVendorReviews = async (req, res) => {
  const vendorId = req.params.id;
  const { sortBy = 'recent' } = req.query;
  
  // Fetch reviews with verified_purchase flag
  // Calculate average rating
  // Show rating distribution
  // Allow filtering by rating
};

// PATCH /api/reviews/:id/vendor-response - Vendor responds
exports.vendorResponse = async (req, res) => {
  const { response } = req.body;
  
  // Only vendor can respond
  // Update review with response
  // Mark response as given
};
```

### 5. Payment Controller

```javascript
// POST /api/payments/create-order - Create payment order
exports.createOrder = async (req, res) => {
  const customerId = req.user.id;
  const { bookingId } = req.body;
  
  // Get booking details
  // Create Razorpay order
  // Store order reference in payments table
  // Return order_id for frontend
};

// POST /api/payments/verify - Verify payment
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;
  
  // Verify signature using HMAC-SHA256
  // Update payment status to 'captured'
  // Update booking status to 'confirmed'
  // Trigger confirmation email
  // Add to payout queue
};

// POST /api/payments/webhook - Razorpay webhook
exports.handleWebhook = async (req, res) => {
  const { event, payload } = req.body;
  
  // Verify webhook signature
  // Handle different events:
  //   - payment.authorized
  //   - payment.captured
  //   - payment.failed
  //   - refund.created
  //   - refund.failed
};
```

---

## 🔐 Authentication Model

```javascript
// JWT Payload for different roles

// CUSTOMER
{
  id: userId,
  role: 'customer',
  email: email,
  iat: timestamp
}

// VENDOR
{
  id: userId,
  role: 'vendor',
  vendorId: vendorId,
  categoryId: categoryId,
  email: email,
  iat: timestamp
}

// ADMIN
{
  id: userId,
  role: 'admin',
  adminLevel: 'super',    // super, moderator, analyst
  email: email,
  iat: timestamp
}
```

---

## 📧 Email Notifications

### Trigger Points

1. **Booking Created** → Customer + Vendor
   - Booking confirmation
   - Booking details
   - Next steps

2. **Payment Received** → Customer + Vendor + Admin
   - Payment confirmation
   - Receipt
   - Booking status update

3. **Booking Confirmed** → Customer + Vendor
   - Confirmation details
   - Cancellation policy
   - Contact information

4. **Booking Completed** → Customer
   - Request for review
   - Thank you message
   - Future offers

5. **Booking Cancelled** → Customer + Vendor
   - Cancellation details
   - Refund status
   - Reason (if provided)

6. **Review Received** → Vendor
   - Notification
   - Option to respond

7. **Vendor Verification** → Vendor
   - Verification approved/rejected
   - Feedback if rejected

---

## 💰 Commission & Payout System

### Commission Calculation

```
Gross Booking Amount: $1000
  ↓
Platform Commission (10%): -$100
  ↓
GST on Commission (18%): -$18
  ↓
Payment Gateway Fee (2.5%): -$25
  ↓
Net Payout Amount: $857
```

### Payout Frequency
- **Weekly** for vendors with $500+ pending
- **Bi-weekly** (default)
- **Monthly** (lower volume vendors)

### Payout Statuses
- `pending` - Waiting for payout period to end
- `processing` - Funds being transferred
- `completed` - Paid to vendor
- `failed` - Transfer failed, retry
- `cancelled` - Vendor requested cancellation

---

## 🔍 Search & Filter Implementation

### Full-Text Search
```sql
SELECT * FROM vendor_services 
WHERE MATCH(title, description) AGAINST(''+search_term+'')
AND base_price BETWEEN priceMin AND priceMax
AND capacity >= minCapacity
AND is_active = true
ORDER BY CASE WHEN rating > 4.5 THEN 1 ELSE 2 END, rating DESC
LIMIT 20 OFFSET (page-1)*20;
```

### Location-Based Search
```sql
SELECT * FROM vendors
WHERE city = ? 
AND state = ?
ORDER BY rating DESC, total_bookings DESC;
```

### Availability-Based Search
```sql
SELECT DISTINCT s.* FROM vendor_services s
WHERE EXISTS (
  SELECT 1 FROM availability_slots
  WHERE service_id = s.id
  AND available_from >= ?
  AND slot_status IN ('available', 'partially_booked')
);
```

---

## 🚀 Performance Optimizations

1. **Caching**
   - Cache service listings (Redis)
   - Cache vendor profiles (Redis)
   - Cache reviews (Redis with TTL)

2. **Database Optimizations**
   - Add indexes on frequently queried columns
   - Use pagination for large result sets
   - Archive old bookings to separate table

3. **API Optimizations**
   - Implement response pagination
   - Use GraphQL for selective field queries
   - Compress responses

4. **Image Optimization**
   - Use CDN (CloudFront, Cloudflare)
   - Auto-resize images
   - Lazy load on frontend

---

## ✅ Implementation Checklist

- [ ] Database migration scripts
- [ ] Authentication system (3 roles)
- [ ] Service discovery APIs
- [ ] Booking system
- [ ] Payment integration
- [ ] Review system
- [ ] Vendor dashboard
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Search & filter
- [ ] Availability calendar
- [ ] Payout system
- [ ] Reporting & analytics
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance testing
- [ ] Security audit
- [ ] Load testing

---

**Ready to start implementing? Let's build Phase 1! 🚀**
