# 🏨 Hotel Listing & Booking Website - Project Specification

## 📋 Project Overview

A multi-role hotel booking platform with three-tier control hierarchy:
- **Developer (Super Admin)** - Full website control
- **Hotel Manager** - Individual hotel management
- **Customer** - Browse & book hotels

**Control Priority:** Developer > Hotel Manager > Customer

---

## 🔐 Authentication & Login Systems

### 1️⃣ Developer (Super Admin)
- **Login Method:** ID + Password
- **Access:** Separate admin dashboard
- **Full Control Over:**
  - Website settings & configuration
  - Hotel CRUD operations (Add/Remove/Edit)
  - Hotel manager approval & blocking
  - Payment configurations
  - Feature toggles (ON/OFF)
  - View all bookings & payments

### 2️⃣ Hotel Manager
- **Login Method:** Credentials provided by Developer
- **Scope:** Can only manage their assigned hotel
- **Capabilities:**
  - Update room availability (Show/Hide)
  - Enable/Disable online booking
  - Enable/Disable online payment
  - Update room prices
  - Update room status (Available/Booked)
  - Upload hotel photos
  - Update hotel details

### 3️⃣ Customer
- **Login Method:** Mobile number + OTP (No password)
- **Capabilities:**
  - Browse available hotels (only if approved by manager)
  - View available/booked rooms
  - Check room prices
  - Book hotel online
  - Pay online (if both developer & manager allow)
  - Check booking status

---

## 💳 Payment & Booking Rules

**Online Payment Enabled ONLY if:**
- ✅ Developer allows (feature enabled)
- ✅ Hotel Manager allows (for that hotel)

**Payment Methods:**
- UPI
- Card (Razorpay/Stripe)

**Booking Status Flow:**
- Pending → Confirmed → Cancelled

**Booking Confirmation:**
- Shown immediately after payment

---

## 🗄️ Database Schema

### Tables Required

1. **developers** - Super admin accounts
2. **hotel_managers** - Manager accounts
3. **customers** - Customer accounts with OTP
4. **hotels** - Hotel listings
5. **rooms** - Hotel rooms
6. **bookings** - Customer bookings
7. **payments** - Payment transactions
8. **booking_status** - Booking history/status updates
9. **website_settings** - Global feature toggles

---

## 🎯 Key Features

### Developer Features
- ✅ Dashboard with analytics
- ✅ Hotel management (CRUD)
- ✅ Manager approval workflow
- ✅ Payment tracking
- ✅ Feature toggles
- ✅ Website settings

### Hotel Manager Features
- ✅ Hotel dashboard
- ✅ Room inventory management
- ✅ Availability visibility control
- ✅ Booking/Payment toggle
- ✅ Price management
- ✅ Photo uploads

### Customer Features
- ✅ OTP-based login
- ✅ Hotel search/filter
- ✅ Room availability check
- ✅ Online booking
- ✅ Online payment
- ✅ Booking history
- ✅ Booking status tracking

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 13 + TypeScript + Tailwind CSS
- **Backend:** Express.js (Node.js)
- **Database:** MySQL 8.0+
- **Auth:** JWT + OTP (Twilio/Firebase)
- **Payment:** Razorpay + Stripe
- **Storage:** AWS S3 (for hotel photos)

---

## 📂 Project Structure

```
hotel-booking-system/
├── database/
│   ├── schema.sql
│   └── migrations/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── developer.js
│   │   ├── manager.js
│   │   ├── customer.js
│   │   ├── bookings.js
│   │   └── payments.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── controllers/
│   ├── utils/
│   └── index.js
├── frontend/
│   ├── pages/
│   │   ├── developer/
│   │   ├── manager/
│   │   └── customer/
│   ├── components/
│   └── lib/
└── docs/
    ├── API.md
    ├── DATABASE.md
    └── SETUP.md
```

---

## 🚀 Implementation Phases

### Phase 1: Database & Backend Setup
- [ ] Create MySQL schema
- [ ] Set up Express.js server
- [ ] Create authentication system
- [ ] Implement middleware & role checks

### Phase 2: Developer Module
- [ ] Developer login & dashboard
- [ ] Hotel CRUD operations
- [ ] Manager approval system
- [ ] Payment management
- [ ] Feature toggles

### Phase 3: Hotel Manager Module
- [ ] Manager login & dashboard
- [ ] Room inventory management
- [ ] Availability controls
- [ ] Booking/Payment toggles
- [ ] Photo uploads

### Phase 4: Customer Module
- [ ] Customer OTP login
- [ ] Hotel listing & search
- [ ] Room availability display
- [ ] Booking system
- [ ] Payment integration

### Phase 5: Testing & Deployment
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment to production

---

## 📊 Control Priority Matrix

| Feature | Developer | Manager | Customer |
| - | - | - | - |
| Hotel Add/Remove | ✅ | ❌ | ❌ |
| Room Price | ❌ | ✅ | 👁️ |
| Show Availability | ✅ Allow | ✅ Toggle | 👁️ View |
| Enable Booking | ✅ Allow | ✅ Toggle | ✅ Use |
| Enable Payment | ✅ Allow | ✅ Toggle | ✅ Use |
| View All Bookings | ✅ | ✅ Own | ✅ Own |
| View All Payments | ✅ | ❌ | ✅ Own |

---

## 🔄 API Endpoints Overview

### Authentication
- `POST /auth/developer/login`
- `POST /auth/manager/login`
- `POST /auth/customer/request-otp`
- `POST /auth/customer/verify-otp`

### Developer APIs
- `GET /api/developer/dashboard`
- `GET /api/developer/hotels`
- `POST /api/developer/hotels`
- `PUT /api/developer/hotels/:id`
- `DELETE /api/developer/hotels/:id`
- `GET /api/developer/managers`
- `PATCH /api/developer/managers/:id/approve`

### Manager APIs
- `GET /api/manager/hotel`
- `PUT /api/manager/hotel`
- `GET /api/manager/rooms`
- `PUT /api/manager/rooms/:id`
- `PATCH /api/manager/rooms/:id/toggle-visibility`

### Customer APIs
- `GET /api/customer/hotels`
- `GET /api/customer/hotels/:id`
- `GET /api/customer/hotels/:id/rooms`
- `POST /api/customer/bookings`
- `GET /api/customer/bookings`
- `GET /api/customer/bookings/:id`

---

## ✅ Success Criteria

1. ✅ Three distinct login systems working
2. ✅ Role-based access control enforced
3. ✅ Control hierarchy respected (Dev > Manager > Customer)
4. ✅ Online payment working (UPI, Card)
5. ✅ Booking confirmation system
6. ✅ All features toggle-able
7. ✅ Mobile-responsive UI
8. ✅ Production-ready deployment

---

**Status:** 🎯 Ready for Development
**Last Updated:** December 19, 2025
