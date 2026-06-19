# Hotel Booking System - Backend API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <accessToken>
```

---

## 1. AUTHENTICATION ENDPOINTS

### Developer Login
**POST** `/auth/developer/login`

**Request Body:**
```json
{
  "dev_id": "DEV001",
  "password": "dev123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token",
  "userRole": "developer",
  "user": {
    "id": 1,
    "dev_id": "DEV001",
    "name": "Developer Admin",
    "email": "dev@example.com"
  }
}
```

**Status Code:** 200 (Success), 401 (Invalid credentials), 400 (Missing fields)

---

### Manager Login
**POST** `/auth/manager/login`

**Request Body:**
```json
{
  "manager_id": "MGR001",
  "password": "manager123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token",
  "userRole": "manager",
  "user": {
    "id": 1,
    "manager_id": "MGR001",
    "name": "Hotel Manager",
    "hotel_id": 1,
    "hotel_name": "Grand Hotel",
    "email": "manager@hotel.com",
    "phone": "+1234567890"
  }
}
```

**Status Code:** 200 (Success), 401 (Invalid credentials), 403 (Not approved)

---

### Customer Request OTP
**POST** `/auth/customer/request-otp`

**Request Body:**
```json
{
  "phone_number": "+919876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "otp_expiry_seconds": 600,
  "_dev_otp": "123456"
}
```

**Status Code:** 200 (Success), 400 (Invalid phone), 429 (Too many requests)

---

### Customer Verify OTP
**POST** `/auth/customer/verify-otp`

**Request Body:**
```json
{
  "phone_number": "+919876543210",
  "otp_code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token",
  "userRole": "customer",
  "user": {
    "customer_id": 1,
    "phone_number": "+919876543210",
    "name": "Customer Name",
    "email": "customer@email.com"
  }
}
```

**Status Code:** 200 (Success), 401 (Invalid/Expired OTP)

---

## 2. HOTEL ENDPOINTS

### Developer: Get All Hotels
**GET** `/developer/hotels`

**Headers:** 
```
Authorization: Bearer <developer_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grand Hotel",
      "city": "New York",
      "address": "123 Main St",
      "phone": "+1234567890",
      "email": "contact@grandhotel.com",
      "rating": 4.5,
      "is_visible": true,
      "status": "active",
      "room_count": 25,
      "created_at": "2024-12-19T10:00:00Z"
    }
  ]
}
```

---

### Developer: Create Hotel
**POST** `/developer/hotels`

**Headers:** 
```
Authorization: Bearer <developer_token>
```

**Request Body:**
```json
{
  "name": "Grand Hotel",
  "city": "New York",
  "address": "123 Main St",
  "phone": "+1234567890",
  "email": "contact@grandhotel.com",
  "description": "A luxury 5-star hotel"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hotel created successfully",
  "data": {
    "id": 1
  }
}
```

---

### Developer: Update Hotel
**PUT** `/developer/hotels/:id`

**Request Body:**
```json
{
  "name": "Grand Hotel Updated",
  "is_visible": true
}
```

---

### Developer: Delete Hotel
**DELETE** `/developer/hotels/:id`

---

### Manager: Get Hotel Details
**GET** `/manager/hotel`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Grand Hotel",
    "city": "New York",
    "address": "123 Main St",
    "room_count": 25
  }
}
```

---

### Manager: Update Hotel Details
**PUT** `/manager/hotel`

**Request Body:**
```json
{
  "name": "Grand Hotel",
  "description": "Updated description"
}
```

---

### Customer: List Visible Hotels
**GET** `/customer/hotels?city=New%20York`

**Query Parameters:**
- `city` (optional): Filter by city name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grand Hotel",
      "city": "New York",
      "rating": 4.5,
      "room_count": 25
    }
  ]
}
```

---

## 3. ROOM ENDPOINTS

### Manager: Get Hotel Rooms
**GET** `/manager/rooms`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hotel_id": 1,
      "room_number": "101",
      "room_type": "double",
      "capacity": 2,
      "price_per_night": 150.00,
      "status": "available",
      "amenities": ["WiFi", "AC", "TV"]
    }
  ]
}
```

---

### Manager: Create Room
**POST** `/manager/rooms`

**Request Body:**
```json
{
  "room_number": "101",
  "room_type": "double",
  "capacity": 2,
  "price_per_night": 150.00,
  "description": "Spacious double room with city view",
  "amenities": ["WiFi", "AC", "TV"]
}
```

---

### Manager: Update Room
**PUT** `/manager/rooms/:id`

**Request Body:**
```json
{
  "price_per_night": 160.00,
  "status": "available"
}
```

---

### Manager: Delete Room
**DELETE** `/manager/rooms/:id`

---

### Customer: Check Room Availability
**GET** `/customer/hotels/:hotelId/availability?checkInDate=2024-12-25&checkOutDate=2024-12-26`

**Query Parameters:**
- `checkInDate` (required): YYYY-MM-DD format
- `checkOutDate` (required): YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "checkInDate": "2024-12-25",
  "checkOutDate": "2024-12-26",
  "availableRooms": [
    {
      "id": 1,
      "room_number": "101",
      "room_type": "double",
      "capacity": 2,
      "price_per_night": 150.00
    }
  ]
}
```

---

## 4. BOOKING ENDPOINTS

### Customer: Create Booking
**POST** `/customer/bookings`

**Request Body:**
```json
{
  "hotelId": 1,
  "roomId": 1,
  "checkInDate": "2024-12-25",
  "checkOutDate": "2024-12-26",
  "numberOfGuests": 2,
  "specialRequests": "Early check-in preferred"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": "BK123456789ABC",
    "id": 1,
    "hotelId": 1,
    "roomId": 1,
    "checkInDate": "2024-12-25",
    "checkOutDate": "2024-12-26",
    "numberOfNights": 1,
    "totalPrice": 150.00,
    "status": "pending",
    "paymentStatus": "pending"
  }
}
```

---

### Customer: Get My Bookings
**GET** `/customer/bookings`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "BK123456789ABC",
      "hotel_name": "Grand Hotel",
      "room_number": "101",
      "check_in_date": "2024-12-25",
      "check_out_date": "2024-12-26",
      "total_price": 150.00,
      "status": "pending",
      "payment_status": "pending"
    }
  ]
}
```

---

### Customer: Get Booking Details
**GET** `/customer/bookings/:bookingId`

---

### Customer: Cancel Booking
**PUT** `/customer/bookings/:bookingId/cancel`

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

---

### Manager: Get Hotel Bookings
**GET** `/manager/bookings`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "booking_id": "BK123456789ABC",
      "room_number": "101",
      "check_in_date": "2024-12-25",
      "customer_phone": "+919876543210",
      "status": "confirmed",
      "total_price": 150.00
    }
  ]
}
```

---

### Manager: Update Booking Status
**PUT** `/manager/bookings/:id/status`

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Allowed Status Values:** `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`

---

## 5. PAYMENT ENDPOINTS

### Customer: Create Payment (Mock)
**POST** `/customer/payments/create`

**Request Body:**
```json
{
  "bookingId": "BK123456789ABC",
  "amount": 150.00,
  "currency": "INR",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "paymentId": "PAY123456789",
    "bookingId": "BK123456789ABC",
    "amount": 150.00,
    "status": "success",
    "paymentMethod": "card"
  }
}
```

---

### Customer: Get Payment Status
**GET** `/customer/payments/:paymentId/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY123456789",
    "bookingId": "BK123456789ABC",
    "status": "paid",
    "amount": 150.00
  }
}
```

---

### Customer: Verify Payment
**POST** `/customer/payments/verify`

**Request Body:**
```json
{
  "bookingId": "BK123456789ABC",
  "paymentId": "PAY123456789"
}
```

---

### Mock: Razorpay Create Order
**POST** `/customer/payments/razorpay/create-order`

**Request Body:**
```json
{
  "bookingId": "BK123456789ABC",
  "amount": 150.00
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_1234567890",
  "amount": 150.00,
  "currency": "INR",
  "keyId": "rzp_test_mock_key"
}
```

---

### Mock: Stripe Create Session
**POST** `/customer/payments/stripe/create-session`

**Request Body:**
```json
{
  "bookingId": "BK123456789ABC",
  "amount": 150.00
}
```

---

### Manager: Get Hotel Payments
**GET** `/manager/payments`

**Response:**
```json
{
  "success": true,
  "totalRevenue": 5400.00,
  "totalTransactions": 36,
  "data": [
    {
      "booking_id": "BK123456789ABC",
      "amount": 150.00,
      "status": "paid",
      "method": "card",
      "customer": "+919876543210"
    }
  ]
}
```

---

## 6. ADMIN/DEVELOPER ENDPOINTS

### Developer: Get Feature Toggles
**GET** `/developer/toggles`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "feature_name": "online_booking",
      "is_enabled": true,
      "description": "Enable online hotel bookings"
    }
  ]
}
```

---

### Developer: Update Feature Toggle
**PUT** `/developer/toggles/:featureName`

**Request Body:**
```json
{
  "isEnabled": true
}
```

---

### Developer: Get Manager Approval Requests
**GET** `/developer/manager-approvals`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "manager_id": "MGR001",
      "name": "Manager Name",
      "hotel_id": 1,
      "hotel_name": "Grand Hotel",
      "status": "pending",
      "created_at": "2024-12-19T10:00:00Z"
    }
  ]
}
```

---

### Developer: Approve Manager
**PUT** `/developer/managers/:managerId/approve`

**Response:**
```json
{
  "success": true,
  "message": "Manager approved successfully"
}
```

---

### Developer: Reject Manager
**PUT** `/developer/managers/:managerId/reject`

---

### Developer: Get Analytics
**GET** `/developer/analytics`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHotels": 5,
    "activeManagers": 5,
    "totalBookings": 150,
    "totalRevenue": 22500.00,
    "activeCustomers": 120,
    "bookingsByStatus": [
      {
        "status": "confirmed",
        "count": 100
      },
      {
        "status": "checked_out",
        "count": 45
      }
    ]
  }
}
```

---

### Manager: Get Hotel Toggles
**GET** `/manager/hotel-toggles`

**Response:**
```json
{
  "success": true,
  "data": {
    "hotelId": 1,
    "showToCustomers": true,
    "enableOnlineBooking": true,
    "enableOnlinePayment": true
  }
}
```

---

### Manager: Update Hotel Toggles
**PUT** `/manager/hotel-toggles`

**Request Body:**
```json
{
  "showToCustomers": true,
  "enableOnlineBooking": true,
  "enableOnlinePayment": true
}
```

---

## Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Access token required" or "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Insufficient permissions for this operation"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Hotel not found" or "Booking not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid input or missing required fields"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "error": "Server error"
}
```

---

## Testing with curl

### Developer Login:
```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{"dev_id":"DEV001","password":"dev123"}'
```

### Get Hotels (requires token):
```bash
curl -X GET http://localhost:3000/api/developer/hotels \
  -H "Authorization: Bearer <access_token>"
```

### Request OTP:
```bash
curl -X POST http://localhost:3000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210"}'
```

---

## Database Setup

Run the schema script:
```bash
mysql -u root < HOTEL_SCHEMA.sql
```

## Environment Variables (.env)

```
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=my_website
JWT_SECRET=your-secret-key-change-in-production
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## Role Hierarchy

**Developer** (Highest)
- Full system control
- Create/manage hotels
- Approve managers
- Control feature toggles
- View analytics

**Manager** (Middle)
- Manage assigned hotel
- Manage rooms
- View hotel bookings
- Control hotel visibility
- View payment reports

**Customer** (Lowest)
- Browse hotels
- Check availability
- Make bookings
- Make payments
- View own bookings

---

**Last Updated:** December 19, 2024
