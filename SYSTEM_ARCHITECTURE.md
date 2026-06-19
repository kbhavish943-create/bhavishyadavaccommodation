# System Architecture & API Flow Documentation

## 🏗️ System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Developer     │  │     Manager     │  │    Customer     │             │
│  │   Dashboard     │  │   Dashboard     │  │   Dashboard     │             │
│  │                 │  │                 │  │                 │             │
│  │  ├─ Hotels      │  │  ├─ Hotel       │  │  ├─ Browse      │             │
│  │  ├─ Managers    │  │  ├─ Rooms       │  │  ├─ Bookings    │             │
│  │  ├─ Settings    │  │  ├─ Bookings    │  │  ├─ Profile     │             │
│  │  └─ Analytics   │  │  └─ Settings    │  │  └─ Payments    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│         ↑                      ↑                      ↑                       │
│         └──────────────────────┴──────────────────────┘                      │
│                    HTTP Requests with JWT                                    │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                      Express.js REST API Server                             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │              Authentication & Authorization Middleware             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ JWT Validate │  │ Token Verify │  │ Role Check   │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │ Auth │  │Hotels│  │Rooms │  │Book  │  │Pay   │  │Admin │               │
│  │Routes│  │Routes│  │Routes│  │Routes│  │Routes│  │Routes│               │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘               │
│     ↓         ↓        ↓         ↓        ↓         ↓                       │
│  Login    Create    Manage   Manage   Process  Approve                     │
│  Users    Hotels    Rooms   Bookings Payments Managers                     │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          MySQL Database                                     │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │Developers│  │ Managers │  │  Hotels  │  │  Rooms   │                   │
│  │          │  │          │  │          │  │          │                   │
│  │- dev_id  │  │-manager_ │  │- name    │  │- room_#  │                   │
│  │- password│  │  id      │  │- city    │  │- type    │                   │
│  │- email   │  │- hotel_id│  │- visible │  │- price   │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │Customers │  │ Bookings │  │Payments  │  │Feature   │                   │
│  │          │  │          │  │          │  │Toggles   │                   │
│  │- phone   │  │-booking_ │  │- payment_│  │          │                   │
│  │- otp     │  │  id      │  │  id      │  │- global  │                   │
│  │- email   │  │- cust_id │  │- status  │  │- hotel-  │                   │
│  └──────────┘  └──────────┘  └──────────┘  │  specific│                   │
│                                              └──────────┘                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### Developer Login
```
┌─────────────────────────────────────────────────────────────────┐
│ Customer submits: {dev_id: "DEV001", password: "dev123"}       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
                    ┌────────────────────┐
                    │ Find developer     │
                    │ in database        │
                    └────────────┬───────┘
                                 │
                    ┌────────────↓───────────┐
                    │ Verify password       │
                    │ (SHA-256 in dev)      │
                    └────────────┬───────────┘
                                 │
                    ┌────────────↓────────────────┐
                    │ Generate JWT Token         │
                    │ ├─ userId                  │
                    │ ├─ userRole: "developer"   │
                    │ └─ expiresIn: 24h          │
                    └────────────┬────────────────┘
                                 │
                    ┌────────────↓──────────────────────────┐
                    │ Response:                            │
                    │ {                                    │
                    │   success: true                      │
                    │   accessToken: "jwt_token"           │
                    │   userRole: "developer"              │
                    │   user: { id, dev_id, name }        │
                    │ }                                    │
                    └────────────┬──────────────────────────┘
                                 │
                                 ↓
                    ┌────────────────────────┐
                    │ Store in localStorage  │
                    │ ├─ accessToken        │
                    │ ├─ refreshToken       │
                    │ ├─ user               │
                    │ └─ userRole           │
                    └────────────────────────┘
```

### Customer OTP Login (2-Step)
```
STEP 1: Request OTP
┌───────────────────────────────────────────────────────────────┐
│ Customer submits: {phone_number: "+919876543210"}            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
            ┌──────────────────────────────┐
            │ Create/Update customer       │
            │ in database                  │
            └────────────┬─────────────────┘
                         │
            ┌────────────↓──────────────┐
            │ Generate 6-digit OTP      │
            │ Set expiry: 10 minutes    │
            └────────────┬──────────────┘
                         │
            ┌────────────↓──────────────┐
            │ Save OTP to database      │
            │ Increment OTP_attempts    │
            └────────────┬──────────────┘
                         │
            ┌────────────↓──────────────────────────┐
            │ Log OTP request (audit trail)        │
            └────────────┬──────────────────────────┘
                         │
            ┌────────────↓────────────────────────────────┐
            │ Response: {                                 │
            │   success: true,                            │
            │   message: "OTP sent",                      │
            │   otp_expiry_seconds: 600,                  │
            │   _dev_otp: "123456"  // Dev only          │
            │ }                                          │
            └──────────────┬───────────────────────────────┘
                          │
                          ↓
            ┌─────────────────────────────┐
            │ Customer receives OTP       │
            │ (via SMS in production)     │
            └─────────────────────────────┘

STEP 2: Verify OTP
┌───────────────────────────────────────────────────────────────┐
│ Customer submits: {                                           │
│   phone_number: "+919876543210",                             │
│   otp_code: "123456"                                         │
│ }                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────↓───────────┐
                │ Find customer        │
                │ by phone_number      │
                └─────────────┬────────┘
                              │
         ┌────────────────────↓───────────────┐
         │ Check: OTP not expired?            │
         └─────────────┬──────────────────────┘
                       │
         ┌─────────────↓──────────────────┐
         │ Check: OTP matches?            │
         └─────────────┬──────────────────┘
                       │
         ┌─────────────↓──────────────────────────┐
         │ Clear OTP from database               │
         │ Reset OTP_attempts to 0               │
         └─────────────┬──────────────────────────┘
                       │
         ┌─────────────↓──────────────────┐
         │ Generate JWT Token             │
         │ ├─ customerId                  │
         │ ├─ userRole: "customer"        │
         │ └─ expiresIn: 24h              │
         └─────────────┬──────────────────┘
                       │
         ┌─────────────↓──────────────────────────┐
         │ Response: {                            │
         │   success: true,                       │
         │   accessToken: "jwt_token",            │
         │   userRole: "customer",                │
         │   user: { customer_id, phone_number } │
         │ }                                      │
         └─────────────┬──────────────────────────┘
                       │
                       ↓
         ┌─────────────────────────────────┐
         │ Store in localStorage           │
         │ Ready to use API                │
         └─────────────────────────────────┘
```

---

## 📱 API Request Flow with Token

```
CLIENT REQUEST
──────────────

POST /api/developer/hotels
Headers: {
  "Authorization": "Bearer eyJhbGc...",
  "Content-Type": "application/json"
}
Body: {
  "name": "Grand Hotel",
  "city": "New York"
}

                           │
                           ↓
                           
SERVER PROCESSING
─────────────────

1. Extract Token
   Authorization header → "Bearer eyJhbGc..."
   Extract token part: "eyJhbGc..."
   
                           │
                           ↓

2. Authenticate
   ┌─ Verify token signature
   ├─ Check token not expired
   └─ Decode to get userId & userRole
   
                           │
                           ↓

3. Authorize (Check Role)
   ┌─ Required role: "developer"
   ├─ User role: "developer" (from token)
   └─ ✓ Access granted
   
                           │
                           ↓

4. Validate Input
   ┌─ name required: ✓
   ├─ city required: ✓
   └─ ✓ Valid
   
                           │
                           ↓

5. Database Operation
   ┌─ INSERT INTO hotels (...)
   ├─ Generated: id = 5
   └─ ✓ Success
   
                           │
                           ↓

6. Send Response
   {
     "success": true,
     "message": "Hotel created successfully",
     "data": { "id": 5 }
   }

                           │
                           ↓
                           
CLIENT RECEIVES RESPONSE
────────────────────────

Status: 200 OK
Body: {
  "success": true,
  "message": "Hotel created successfully",
  "data": { "id": 5 }
}
```

---

## 🏪 Hotel Booking Flow

```
CUSTOMER JOURNEY
────────────────

1. LOGIN
   └─ POST /auth/customer/request-otp → Get OTP
   └─ POST /auth/customer/verify-otp → Get token
   
                           │
                           ↓

2. BROWSE
   └─ GET /customer/hotels → List visible hotels
   └─ GET /hotels/:id → View hotel details
   └─ Filter by city, rating, price
   
                           │
                           ↓

3. CHECK AVAILABILITY
   └─ GET /customer/hotels/:id/availability
      ├─ checkInDate: "2024-12-25"
      ├─ checkOutDate: "2024-12-26"
      └─ Response: Available rooms with prices
   
                           │
                           ↓

4. CREATE BOOKING
   └─ POST /customer/bookings
      ├─ hotelId: 1
      ├─ roomId: 1
      ├─ checkInDate: "2024-12-25"
      ├─ checkOutDate: "2024-12-26"
      ├─ numberOfGuests: 2
      └─ Response: Booking created (BK123456789)
                   Status: "pending"
                   Price calculated: 150 × 1 night = $150
   
                           │
                           ↓

5. PAYMENT
   └─ Option A: Mock Payment
      └─ POST /customer/payments/create
         ├─ bookingId: "BK123456789"
         ├─ amount: 150.00
         └─ Response: Payment successful
   
   └─ Option B: Razorpay
      └─ POST /customer/payments/razorpay/create-order
         └─ Response: orderId → Open Razorpay modal
   
   └─ Option C: Stripe
      └─ POST /customer/payments/stripe/create-session
         └─ Response: sessionId → Redirect to Stripe
   
                           │
                           ↓

6. CONFIRMATION
   └─ Booking status: "pending" → "confirmed"
   └─ Payment status: "pending" → "paid"
   └─ GET /customer/bookings → View all bookings
   
                           │
                           ↓

7. MANAGEMENT
   └─ GET /customer/bookings/:id → View booking details
   └─ PUT /customer/bookings/:id/cancel → Cancel if needed
```

---

## 🔄 Manager Operations Flow

```
MANAGER WORKFLOW
────────────────

1. LOGIN
   └─ POST /auth/manager/login
      ├─ Need: manager_id, password
      ├─ Status must be: "approved"
      └─ Get: accessToken with role="manager"
   
                           │
                           ↓

2. VIEW HOTEL
   └─ GET /manager/hotel
      └─ Returns: Assigned hotel details
   
                           │
                           ↓

3. MANAGE ROOMS
   ├─ GET /manager/rooms
   │  └─ List all rooms in hotel
   │
   ├─ POST /manager/rooms
   │  ├─ room_number, room_type
   │  ├─ capacity, price_per_night
   │  └─ Create new room
   │
   ├─ PUT /manager/rooms/:id
   │  ├─ Update price, status
   │  └─ Modify room details
   │
   └─ DELETE /manager/rooms/:id
      └─ Remove room
   
                           │
                           ↓

4. MANAGE BOOKINGS
   ├─ GET /manager/bookings
   │  └─ List all hotel bookings
   │
   └─ PUT /manager/bookings/:id/status
      ├─ Change status:
      │  ├─ pending → confirmed
      │  ├─ confirmed → checked_in
      │  ├─ checked_in → checked_out
      │  └─ any → cancelled
      └─ Update booking state

                           │
                           ↓

5. CONTROL VISIBILITY
   ├─ GET /manager/hotel-toggles
   │  └─ View current settings
   │
   └─ PUT /manager/hotel-toggles
      ├─ showToCustomers: true/false
      │  └─ Controls if hotel visible to customers
      │
      ├─ enableOnlineBooking: true/false
      │  └─ Controls if customers can make bookings
      │
      └─ enableOnlinePayment: true/false
         └─ Controls if customers can pay online

                           │
                           ↓

6. VIEW REPORTS
   └─ GET /manager/payments
      ├─ totalRevenue: $5400
      ├─ totalTransactions: 36
      └─ Payment details by booking
```

---

## 👨‍💼 Developer Admin Flow

```
DEVELOPER OPERATIONS
────────────────────

1. LOGIN
   └─ POST /auth/developer/login
      ├─ Need: dev_id, password
      └─ Get: accessToken with role="developer"
   
                           │
                           ↓

2. HOTEL MANAGEMENT
   ├─ GET /developer/hotels → List all
   ├─ POST /developer/hotels → Create
   ├─ PUT /developer/hotels/:id → Update
   └─ DELETE /developer/hotels/:id → Delete
   
                           │
                           ↓

3. MANAGER APPROVAL
   ├─ GET /developer/manager-approvals
   │  └─ View pending requests
   │
   ├─ PUT /developer/managers/:id/approve
   │  └─ Approve manager → Status: approved
   │
   └─ PUT /developer/managers/:id/reject
      └─ Reject manager → Status: rejected
   
                           │
                           ↓

4. FEATURE CONTROLS (Global)
   ├─ GET /developer/toggles
   │  └─ View all 6 features
   │
   └─ PUT /developer/toggles/:name
      ├─ online_booking
      ├─ online_payment
      ├─ razorpay
      ├─ stripe
      ├─ email_notifications
      └─ sms_notifications
   
                           │
                           ↓

5. ANALYTICS
   └─ GET /developer/analytics
      ├─ totalHotels: 5
      ├─ activeManagers: 5
      ├─ totalBookings: 150
      ├─ totalRevenue: $22,500
      ├─ activeCustomers: 120
      └─ bookingsByStatus: {...}
```

---

## 🗄️ Database Relationships

```
developers (1)
    │
    └──────────────────────────────────────┐
                                           │
                                    ↓
managers (Many)
    │
    └──→ hotels (1) ←───┐
         │               │
         │          created_by
         │
         └──→ rooms (Many)
              │
              └──→ bookings (Many)
                   │
                   └──→ customers (1)
                        │
                        └──→ bookings (Many)
                             │
                             └──→ payments


Example Relations:
─────────────────
1 Developer
  ├─ Can create multiple Hotels
  ├─ Can approve multiple Managers
  └─ Can control global Feature Toggles

1 Manager
  ├─ Manages 1 Hotel
  ├─ Can create multiple Rooms
  └─ Can view all Hotel Bookings

1 Hotel
  ├─ Has multiple Rooms
  ├─ Can have multiple Bookings
  └─ Has 1 Manager

1 Room
  ├─ Belongs to 1 Hotel
  └─ Can have multiple Bookings

1 Booking
  ├─ Belongs to 1 Customer
  ├─ Belongs to 1 Hotel
  ├─ Belongs to 1 Room
  └─ Has 1 Payment

1 Customer
  └─ Can have multiple Bookings
```

---

## ⏱️ Token Lifecycle

```
TOKEN GENERATION (Login)
════════════════════════

User submits credentials
      │
      ↓
Credentials verified
      │
      ↓
JWT Token Created
├─ Payload: {userId, userRole}
├─ Expires: 24 hours from now
└─ Signed with JWT_SECRET
      │
      ↓
Response sent to client with:
├─ accessToken
├─ refreshToken
└─ user data
      │
      ↓
Client stores in localStorage
├─ accessToken
├─ refreshToken
├─ user
└─ userRole

TOKEN USAGE (API Requests)
══════════════════════════

Client makes request with header:
Authorization: Bearer <accessToken>
      │
      ↓
Server receives request
      │
      ├─ Extract token from header
      ├─ Remove "Bearer " prefix
      └─ Get JWT string
      │
      ↓
Server validates token
      ├─ Check signature (matches JWT_SECRET)
      ├─ Check expiration (not older than 24h)
      └─ Decode payload
      │
      ↓
If valid:
├─ Extract userId & userRole
├─ Check authorization (role level)
└─ Process request
      │
      ↓
If invalid:
├─ Return 401 Unauthorized
└─ Client should request new token

TOKEN EXPIRATION (24 hours)
═══════════════════════════

After 24 hours from generation:
      │
      ↓
Token expires
      │
      ↓
Next API request fails:
├─ Status: 401
└─ Message: "Invalid or expired token"
      │
      ↓
Client action:
├─ Option 1: Use refreshToken to get new token
├─ Option 2: Send user back to login page
└─ User logs in again for new token
```

---

## 🔒 Role Hierarchy & Permissions

```
PERMISSION MATRIX
═════════════════

Operation                  | Developer | Manager | Customer
───────────────────────────┼───────────┼─────────┼──────────
Create Hotel               |    ✓      |    ✗    |    ✗
Update Hotel               |    ✓      |    ✗    |    ✗
Delete Hotel               |    ✓      |    ✗    |    ✗
Create Room                |    ✗      |    ✓    |    ✗
Update Room                |    ✗      |    ✓    |    ✗
Delete Room                |    ✗      |    ✓    |    ✗
Browse Hotels              |    ✓      |    ✓    |    ✓
Check Availability         |    ✓      |    ✓    |    ✓
Create Booking             |    ✗      |    ✗    |    ✓
Update Booking Status      |    ✗      |    ✓    |    ✗
Cancel Booking             |    ✗      |    ✓    |    ✓*
Process Payment            |    ✗      |    ✗    |    ✓
View All Bookings          |    ✓      |    ✓    |    ✗
View Own Bookings          |    ✓      |    ✓    |    ✓
View Analytics             |    ✓      |    ✗    |    ✗
Approve Managers           |    ✓      |    ✗    |    ✗
Control Global Toggles     |    ✓      |    ✗    |    ✗
Control Hotel Toggles      |    ✗      |    ✓    |    ✗

* Customer can cancel own bookings only
```

---

**Complete Architecture Documentation**  
**Created:** December 19, 2024  
**System:** Hotel Booking Platform
