# 🎉 Multi-Service Booking Platform Upgrade
**Transform: Hotel-Only → Modern Multi-Service Marketplace**

---

## 📋 Platform Overview

### Services Supported
1. **🏨 Hotels** - Room booking with check-in/check-out
2. **💍 Marriage Halls** - Wedding venue booking with capacity & decorations
3. **🎂 Birthday Venues** - Party space with catering options
4. **🎉 Party Function Halls** - Corporate & social event spaces
5. **✨ Event Services** - Catering, Photography, Decoration, DJs

### User Roles
- **Admin** - Super admin controlling entire platform
- **Vendor** - Businesses listing their services (Hotel, Hall Owner, Service Provider)
- **Customer** - End users browsing and booking services
- **Staff** - Vendor employees managing bookings

---

## 🗄️ Enhanced Database Schema

### NEW Tables Required

```sql
-- 1. SERVICE CATEGORIES
CREATE TABLE service_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,           -- Hotels, Marriage Hall, Birthday, etc
  slug VARCHAR(50) UNIQUE,
  icon VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SERVICE VENDORS (Unified seller account)
CREATE TABLE vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  business_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,          -- Foreign key to service_categories
  phone VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  total_bookings INT DEFAULT 0,
  profile_image VARCHAR(255),
  documents JSON,                     -- Store ID proofs, certificates as JSON
  bank_details JSON ENCRYPTED,        -- For payouts
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  UNIQUE KEY unique_vendor (user_id, category_id)
);

-- 3. VENDOR SERVICES (Individual service listings)
CREATE TABLE vendor_services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  service_type VARCHAR(100),          -- "Deluxe Room", "Vegetarian Catering", etc
  title VARCHAR(255),
  description TEXT,
  base_price DECIMAL(10, 2),
  capacity INT,                       -- Max guests/people
  service_duration_minutes INT,       -- For services like photography
  amenities JSON,                     -- List of amenities
  images JSON,                        -- Array of image URLs
  availability_type ENUM('always', 'slots', 'calendar') DEFAULT 'calendar',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- 4. AVAILABILITY CALENDAR
CREATE TABLE availability_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT NOT NULL,
  available_from DATETIME,
  available_until DATETIME,
  max_bookings INT DEFAULT 1,
  booked_count INT DEFAULT 0,
  price DECIMAL(10, 2),               -- Override base price if needed
  status ENUM('available', 'blocked', 'fully_booked') DEFAULT 'available',
  FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
  INDEX idx_availability (service_id, available_from)
);

-- 5. BOOKINGS (Unified for all service types)
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_reference VARCHAR(50) UNIQUE,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  service_id INT NOT NULL,
  category_id INT NOT NULL,           -- For quick filtering
  booking_date DATETIME,              -- When customer wants the service
  checkin_date DATETIME,              -- For hotels (optional)
  checkout_date DATETIME,             -- For hotels (optional)
  guest_count INT,
  special_requests TEXT,
  total_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2),
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
  cancellation_reason VARCHAR(255),
  refund_status ENUM('no_refund', 'pending', 'completed') DEFAULT 'no_refund',
  refund_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (service_id) REFERENCES vendor_services(id),
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  INDEX idx_customer (customer_id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_status (status),
  INDEX idx_booking_date (booking_date)
);

-- 6. REVIEWS & RATINGS
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT,
  photos JSON,                        -- Photos from customer
  is_verified BOOLEAN DEFAULT FALSE,  -- Verified purchase
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_vendor (vendor_id)
);

-- 7. PAYMENTS (Enhanced)
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  amount DECIMAL(10, 2),
  payment_method ENUM('card', 'upi', 'wallet', 'bank_transfer') DEFAULT 'card',
  gateway ENUM('razorpay', 'stripe', 'paytm') DEFAULT 'razorpay',
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_signature VARCHAR(255),
  payment_status ENUM('pending', 'authorized', 'captured', 'failed', 'refunded') DEFAULT 'pending',
  payment_date DATETIME,
  fee DECIMAL(10, 2),                 -- Platform fee
  net_amount DECIMAL(10, 2),          -- Amount to vendor (after fees)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_booking (booking_id),
  INDEX idx_status (payment_status)
);

-- 8. VENDOR PAYOUTS
CREATE TABLE vendor_payouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  amount DECIMAL(10, 2),
  period_from DATE,
  period_to DATE,
  transaction_reference VARCHAR(255),
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_vendor (vendor_id)
);

-- 9. WISHLIST
CREATE TABLE wishlists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  service_id INT NOT NULL,
  vendor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES vendor_services(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  UNIQUE KEY unique_wishlist (customer_id, service_id)
);

-- 10. PLATFORM SETTINGS
CREATE TABLE platform_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE,
  setting_value TEXT,
  category VARCHAR(50),               -- 'payment', 'booking', 'vendor', 'customer'
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🎨 Frontend Features (Modern)

### 1. **Homepage**
- Service category carousel/grid
- Search bar (by service type, location, date)
- Featured vendors/services
- Customer testimonials
- Trust badges & certifications

### 2. **Service Discovery**
- Advanced filters: Category, Price, Rating, Capacity, Location
- Map view integration (Google Maps)
- Sort by: Popularity, Price, Rating, Availability
- Vendor comparison view
- Video gallery from vendors

### 3. **Vendor Details Page**
- Photo carousel (high-quality images)
- Service descriptions
- Amenities/features checklist
- Availability calendar
- Customer reviews & ratings with photos
- Vendor info: License, certifications, years of experience
- "Contact Vendor" button

### 4. **Booking Flow**
- Select date/time (calendar picker)
- Guest count selection
- Customization options (themes, food type, decorations)
- Add-ons/extras
- Special requests
- Estimated total price
- Secure checkout

### 5. **Customer Dashboard**
- Upcoming bookings
- Booking history
- Saved favorites/wishlist
- Payment history
- Reviews you've given
- Account settings
- Notifications

### 6. **Vendor Dashboard**
- Booking management (accept/reject/reschedule)
- Calendar view of all bookings
- Customer inquiries
- Revenue analytics
- Service management (add/edit/delete)
- Availability management
- Review responses
- Payout history

### 7. **Admin Dashboard**
- Vendor verification management
- Platform analytics
- Booking statistics
- Revenue reports
- Dispute resolution
- Content management (categories, banners)
- User management

---

## 🛠️ Backend API Endpoints

### Authentication
```
POST /api/auth/customer/register
POST /api/auth/customer/login
POST /api/auth/vendor/register
POST /api/auth/vendor/login
POST /api/auth/logout
POST /api/auth/refresh-token
```

### Services & Discovery
```
GET /api/services - List all services with filters
GET /api/services/:id - Service details
GET /api/vendors/:id - Vendor profile
GET /api/categories - Service categories
GET /api/vendors/search - Search vendors
GET /api/availability/:serviceId - Check availability
```

### Bookings
```
POST /api/bookings - Create booking
GET /api/bookings/:id - Get booking details
GET /api/my-bookings - Customer's bookings
GET /api/vendor-bookings - Vendor's bookings
PATCH /api/bookings/:id - Update booking
POST /api/bookings/:id/cancel - Cancel booking
POST /api/bookings/:id/reschedule - Reschedule booking
```

### Payments
```
POST /api/payments/create-order - Create payment order
POST /api/payments/verify - Verify payment
POST /api/payments/webhook - Payment gateway webhook
GET /api/payments/history - Payment history
```

### Reviews
```
POST /api/reviews - Add review
GET /api/vendor/:id/reviews - Vendor's reviews
PATCH /api/reviews/:id - Edit review
DELETE /api/reviews/:id - Delete review
POST /api/reviews/:id/helpful - Mark as helpful
```

### Vendor Management
```
POST /api/vendor/services - Create service
PUT /api/vendor/services/:id - Update service
DELETE /api/vendor/services/:id - Delete service
POST /api/vendor/availability - Set availability
GET /api/vendor/dashboard - Vendor stats
POST /api/vendor/payout-request - Request payout
```

### Wishlist
```
POST /api/wishlists/:serviceId - Add to wishlist
DELETE /api/wishlists/:serviceId - Remove from wishlist
GET /api/my-wishlists - Get customer's wishlist
```

---

## 🎯 Implementation Roadmap

### Phase 1: Database & Backend (Week 1-2)
- [ ] Create new database schema
- [ ] Create unified vendor authentication system
- [ ] Build service discovery APIs
- [ ] Implement booking system for all categories
- [ ] Payment processing (unified)
- [ ] Review system

### Phase 2: Frontend - Customer Side (Week 2-3)
- [ ] Homepage redesign
- [ ] Service discovery & search
- [ ] Vendor details page
- [ ] Booking flow
- [ ] Customer dashboard
- [ ] Review system UI

### Phase 3: Frontend - Vendor Side (Week 3-4)
- [ ] Vendor registration & verification
- [ ] Vendor dashboard
- [ ] Service management
- [ ] Booking management
- [ ] Analytics

### Phase 4: Admin & Advanced Features (Week 4-5)
- [ ] Admin dashboard
- [ ] Dispute resolution
- [ ] Platform analytics
- [ ] Payment settlements
- [ ] Email notifications
- [ ] SMS notifications

### Phase 5: Polish & Launch (Week 5-6)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Testing (unit, integration, e2e)
- [ ] Deployment
- [ ] Launch marketing materials

---

## 💡 Key Features for Modern Platform

### 1. **Search & Filter**
- Full-text search across all services
- Location-based search (Google Maps integration)
- Date & time range selection
- Price range filter
- Rating filter
- Capacity filter

### 2. **Smart Recommendations**
- "You might like" based on browsing history
- "Trending now" section
- Similar services
- Popular in your city

### 3. **Trust & Safety**
- Vendor verification badges
- License/certification display
- Customer review system with photos
- Secure payment (encrypted)
- Money-back guarantee (if booking cancelled)
- 24/7 customer support chat

### 4. **Convenience**
- One-click booking
- Save favorites
- Wishlist
- Booking reminders via SMS/Email
- Flexible cancellation policies
- Rescheduling options

### 5. **Analytics & Insights**
- Customer: Booking history, spending trends
- Vendor: Revenue, peak booking times, customer feedback
- Admin: Platform metrics, vendor performance, fraud detection

### 6. **Mobile Responsive**
- Mobile-first design
- Progressive Web App (PWA)
- One-tap booking
- Push notifications

---

## 🚀 Technology Stack

### Frontend
- **Framework:** Next.js 13+ (React 18)
- **Styling:** Tailwind CSS
- **Maps:** Google Maps API
- **Payment:** Razorpay SDK + Stripe SDK
- **State Management:** Redux or Zustand
- **Forms:** React Hook Form
- **Notifications:** Sonner Toast

### Backend
- **Runtime:** Node.js + Express
- **Database:** MySQL 8.0+
- **Auth:** JWT + OAuth2
- **Payment Gateway:** Razorpay + Stripe
- **File Storage:** AWS S3 or Cloudinary
- **Caching:** Redis
- **Background Jobs:** Bull Queue

### DevOps
- **Hosting:** AWS/Azure/DigitalOcean
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + DataDog
- **Email:** SendGrid
- **SMS:** Twilio

---

## 📊 Pricing Model (Recommended)

### For Customers
- **Free** - Browse, search, read reviews
- **Premium** - $9.99/month - Early access, exclusive deals

### For Vendors
- **Starter** - Free (no commissions, limited features)
- **Pro** - $29.99/month - 5% commission, advanced analytics
- **Enterprise** - Custom pricing - White-label, API access

### Platform Commission
- 10-15% on all bookings
- Additional fees for payment processing (2-3%)

---

## ✅ Success Metrics

1. **User Growth** - Target: 10K customers + 1K vendors by Month 6
2. **Booking Volume** - Target: 500 bookings/month by Month 6
3. **Customer Satisfaction** - Target: 4.5+ average rating
4. **Vendor Satisfaction** - Target: 90% vendor retention
5. **Revenue** - Target: $50K MRR by Month 12

---

## 🔒 Security Considerations

- Two-factor authentication (2FA) for vendors
- Vendor identity verification (GST, business license)
- Encrypted payment processing (PCI DSS compliant)
- Data encryption at rest and in transit
- Regular security audits
- Fraud detection system

---

**Ready to build? Let's start with Phase 1! 🚀**
