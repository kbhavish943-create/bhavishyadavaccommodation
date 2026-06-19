# Hotel Booking System - Backend API Documentation

## Overview

Three-tier hotel booking system with role-based access control (Developer, Manager, Customer). All API responses follow a standard format with `success`, `data`, and `message` fields.

**Base URL:** `http://localhost:3000/api`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE"
}
```

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Developer Login
**POST** `/auth/developer/login`

Login for Super Admin (Developer)

**Request Body:**
```json
{
  "dev_id": "DEV001",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "dev_id": "DEV001",
      "name": "Administrator",
      "email": "admin@example.com",
      "role": "developer"
    }
  },
  "message": "Developer login successful"
}
```

---

### 1.2 Manager Login
**POST** `/auth/manager/login`

Login for Hotel Manager

**Request Body:**
```json
{
  "manager_id": "MGR001",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 5,
      "manager_id": "MGR001",
      "name": "John Manager",
      "email": "manager@example.com",
      "hotel_id": 1,
      "hotel_name": "Grand Hotel",
      "role": "manager"
    }
  },
  "message": "Manager login successful"
}
```

---

### 1.3 Customer Request OTP
**POST** `/auth/customer/request-otp`

Request OTP for customer login (no password needed)

**Request Body:**
```json
{
  "phone_number": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phone_number": "+919876543210",
    "otp_expiry_seconds": 600,
    "message": "OTP sent to your phone number"
  },
  "message": "OTP sent successfully"
}
```

---

### 1.4 Customer Verify OTP & Login
**POST** `/auth/customer/verify-otp`

Verify OTP and login customer

**Request Body:**
```json
{
  "phone_number": "+919876543210",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 10,
      "phone_number": "+919876543210",
      "name": "Customer Name",
      "email": "customer@example.com",
      "role": "customer"
    }
  },
  "message": "Customer login successful"
}
```

---

### 1.5 Refresh Token
**POST** `/auth/refresh-token`

Generate new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token_here"
  },
  "message": "Token refreshed successfully"
}
```

---

### 1.6 Logout
**POST** `/auth/logout`

Logout user (clear tokens on client side)

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

---

## 2. CUSTOMER ENDPOINTS

### 2.1 Get Hotels (Public)
**GET** `/customer/hotels`

Get all available hotels

**Query Parameters:**
- `city` (optional): Filter by city
- `check_in` (optional): Check-in date (YYYY-MM-DD)
- `check_out` (optional): Check-out date (YYYY-MM-DD)
- `guests` (optional): Number of guests

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grand Hotel",
      "city": "Mumbai",
      "state": "Maharashtra",
      "address": "123 Main Street",
      "phone_number": "+919876543210",
      "email": "grand@example.com",
      "description": "Luxury hotel in heart of city",
      "room_count": 50,
      "min_price": 2000
    }
  ],
  "message": "Hotels retrieved successfully"
}
```

---

### 2.2 Get Hotel Details
**GET** `/customer/hotels/:id`

Get hotel details with rooms

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Grand Hotel",
    "city": "Mumbai",
    "address": "123 Main Street",
    "rooms": [
      {
        "id": 1,
        "room_number": "101",
        "room_type": "Deluxe",
        "price_per_night": 3000,
        "max_occupancy": 2,
        "amenities": "AC, WiFi, TV",
        "photos": "url_to_photo.jpg"
      }
    ]
  },
  "message": "Hotel details retrieved successfully"
}
```

---

### 2.3 Create Booking (Protected)
**POST** `/customer/bookings`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "room_id": 1,
  "check_in_date": "2024-01-15",
  "check_out_date": "2024-01-17",
  "guest_count": 2,
  "special_requests": "High floor room please"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "booking_reference": "BK1705328400",
    "room_id": 1,
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-17",
    "nights": 2,
    "total_price": 6000,
    "status": "pending",
    "payment_enabled": true
  },
  "message": "Booking created successfully"
}
```

---

### 2.4 Get Customer Bookings (Protected)
**GET** `/customer/bookings`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "booking_reference": "BK1705328400",
      "hotel_name": "Grand Hotel",
      "room_number": "101",
      "room_type": "Deluxe",
      "check_in_date": "2024-01-15",
      "check_out_date": "2024-01-17",
      "total_price": 6000,
      "status": "confirmed",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "message": "Bookings retrieved successfully"
}
```

---

### 2.5 Get Booking Details (Protected)
**GET** `/customer/bookings/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "booking_reference": "BK1705328400",
    "hotel_name": "Grand Hotel",
    "city": "Mumbai",
    "room_number": "101",
    "room_type": "Deluxe",
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-17",
    "total_price": 6000,
    "status": "confirmed",
    "amenities": "AC, WiFi, TV",
    "photos": "url_to_photo.jpg",
    "payment": {
      "id": 3,
      "payment_gateway": "razorpay",
      "amount": 6000,
      "payment_status": "completed",
      "payment_date": "2024-01-10T15:30:00Z"
    }
  },
  "message": "Booking details retrieved successfully"
}
```

---

### 2.6 Cancel Booking (Protected)
**PUT** `/customer/bookings/:id/cancel`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "cancellation_reason": "Changed travel plans"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "cancelled"
  },
  "message": "Booking cancelled successfully"
}
```

---

### 2.7 Get Customer Profile (Protected)
**GET** `/customer/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "phone_number": "+919876543210",
    "name": "John Customer",
    "email": "customer@example.com",
    "is_phone_verified": true,
    "last_login": "2024-01-10T10:00:00Z",
    "created_at": "2024-01-05T08:00:00Z"
  },
  "message": "Profile retrieved successfully"
}
```

---

### 2.8 Update Customer Profile (Protected)
**PUT** `/customer/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "John Customer",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Customer",
    "email": "newemail@example.com"
  },
  "message": "Profile updated successfully"
}
```

---

## 3. MANAGER ENDPOINTS

All manager endpoints require:
- **Authentication:** Bearer token
- **Role:** Manager
- **Access:** Only own hotel's data

### 3.1 Get Rooms
**GET** `/manager/rooms`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "room_number": "101",
      "room_type": "Deluxe",
      "price_per_night": 3000,
      "max_occupancy": 2,
      "amenities": "AC, WiFi, TV",
      "is_available": true,
      "hotel_id": 1,
      "booking_count": 5
    }
  ],
  "message": "Rooms retrieved successfully"
}
```

---

### 3.2 Create Room
**POST** `/manager/rooms`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "room_number": "102",
  "room_type": "Deluxe",
  "price_per_night": 3000,
  "max_occupancy": 2,
  "amenities": "AC, WiFi, TV, Mini Bar",
  "photos": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "room_number": "102",
    "room_type": "Deluxe",
    "price_per_night": 3000,
    "max_occupancy": 2
  },
  "message": "Room created successfully"
}
```

---

### 3.3 Update Room
**PUT** `/manager/rooms/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "room_number": "102",
  "room_type": "Deluxe Suite",
  "price_per_night": 3500,
  "max_occupancy": 3,
  "amenities": "AC, WiFi, TV, Mini Bar, Jacuzzi",
  "photos": "https://example.com/photo.jpg"
}
```

---

### 3.4 Update Room Price
**PUT** `/manager/rooms/:id/price`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "price_per_night": 3500
}
```

---

### 3.5 Delete Room
**DELETE** `/manager/rooms/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

### 3.6 Get Bookings
**GET** `/manager/bookings`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, cancelled, completed)
- `check_in_date` (optional): Filter by check-in date
- `check_out_date` (optional): Filter by check-out date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "booking_reference": "BK1705328400",
      "customer_name": "John Customer",
      "customer_phone": "+919876543210",
      "room_number": "101",
      "room_type": "Deluxe",
      "check_in_date": "2024-01-15",
      "check_out_date": "2024-01-17",
      "status": "confirmed",
      "total_price": 6000,
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "message": "Bookings retrieved successfully"
}
```

---

### 3.7 Get Booking Details
**GET** `/manager/bookings/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "booking_reference": "BK1705328400",
    "customer_name": "John Customer",
    "customer_phone": "+919876543210",
    "customer_email": "customer@example.com",
    "room_number": "101",
    "room_type": "Deluxe",
    "hotel_name": "Grand Hotel",
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-17",
    "total_price": 6000,
    "status": "confirmed",
    "history": [
      {
        "id": 1,
        "old_status": "pending",
        "new_status": "confirmed",
        "changed_by_type": "system",
        "changed_by_id": null,
        "notes": "Payment verified",
        "created_at": "2024-01-10T15:30:00Z"
      }
    ]
  },
  "message": "Booking details retrieved successfully"
}
```

---

### 3.8 Update Booking Status
**PUT** `/manager/bookings/:id/status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Confirmed by manager"
}
```

---

### 3.9 Get Manager Analytics
**GET** `/manager/analytics`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_rooms": 50,
      "total_bookings": 120,
      "confirmed_bookings": 95,
      "total_revenue": 285000
    },
    "room_occupancy": [
      {
        "room_number": "101",
        "room_type": "Deluxe",
        "booking_count": 25,
        "occupancy_rate": 75.5
      }
    ],
    "recent_bookings": [...]
  },
  "message": "Analytics retrieved successfully"
}
```

---

## 4. DEVELOPER ENDPOINTS

All developer endpoints require:
- **Authentication:** Bearer token
- **Role:** Developer (Super Admin)
- **Access:** All data (full control)

### 4.1 Get All Hotels
**GET** `/developer/hotels`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grand Hotel",
      "city": "Mumbai",
      "address": "123 Main Street",
      "phone_number": "+919876543210",
      "manager_count": 2,
      "room_count": 50,
      "booking_count": 120,
      "created_at": "2024-01-01T08:00:00Z"
    }
  ],
  "message": "Hotels retrieved successfully"
}
```

---

### 4.2 Create Hotel
**POST** `/developer/hotels`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "Grand Hotel",
  "city": "Mumbai",
  "state": "Maharashtra",
  "address": "123 Main Street",
  "phone_number": "+919876543210",
  "email": "grand@example.com",
  "description": "Luxury hotel in heart of city"
}
```

---

### 4.3 Update Hotel
**PUT** `/developer/hotels/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

### 4.4 Delete Hotel
**DELETE** `/developer/hotels/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

### 4.5 Get Manager Approval Requests
**GET** `/developer/manager-requests`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "manager_id": "MGR001",
      "name": "John Manager",
      "email": "manager@example.com",
      "phone_number": "+919876543210",
      "hotel_name": "Grand Hotel",
      "created_at": "2024-01-10T10:00:00Z",
      "is_approved_by_developer": false
    }
  ],
  "message": "Manager requests retrieved successfully"
}
```

---

### 4.6 Approve Manager
**POST** `/developer/manager-requests/:id/approve`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "notes": "Manager credentials verified"
}
```

---

### 4.7 Reject Manager Request
**POST** `/developer/manager-requests/:id/reject`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

---

### 4.8 Get Website Settings
**GET** `/developer/settings`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "online_payment_enabled": {
      "value": true,
      "description": "Enable online payment for bookings"
    },
    "razorpay_enabled": {
      "value": true,
      "description": "Enable Razorpay payment gateway"
    },
    "stripe_enabled": {
      "value": true,
      "description": "Enable Stripe payment gateway"
    },
    "otp_enabled": {
      "value": true,
      "description": "Enable OTP-based customer login"
    },
    "email_notifications_enabled": {
      "value": true,
      "description": "Send email notifications"
    },
    "sms_notifications_enabled": {
      "value": false,
      "description": "Send SMS notifications"
    }
  },
  "message": "Settings retrieved successfully"
}
```

---

### 4.9 Update Setting
**PUT** `/developer/settings/:key`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "value": true
}
```

---

### 4.10 Get Dashboard Analytics
**GET** `/developer/analytics/dashboard`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_hotels": 5,
      "total_managers": 8,
      "total_rooms": 250,
      "total_bookings": 500,
      "confirmed_bookings": 420,
      "total_revenue": 1250000
    },
    "recent_bookings": [...],
    "hotel_stats": [...]
  },
  "message": "Analytics retrieved successfully"
}
```

---

### 4.11 Get Payment Analytics
**GET** `/developer/analytics/payments`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_payments": 420,
      "completed_count": 400,
      "failed_count": 20,
      "total_amount": 1250000,
      "avg_amount": 2976.19
    },
    "by_gateway": [
      {
        "payment_gateway": "razorpay",
        "count": 250,
        "total_amount": 750000
      },
      {
        "payment_gateway": "stripe",
        "count": 150,
        "total_amount": 500000
      }
    ],
    "daily": [...]
  },
  "message": "Payment analytics retrieved successfully"
}
```

---

### 4.12 Get Audit Logs
**GET** `/developer/audit-logs`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `action` (optional): Filter by action type
- `entity_type` (optional): Filter by entity type
- `limit` (optional): Number of records (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "user_type": "developer",
        "user_id": 1,
        "action": "create",
        "entity_type": "hotel",
        "entity_id": 1,
        "details": "{\"name\": \"Grand Hotel\"}",
        "created_at": "2024-01-10T10:00:00Z"
      }
    ],
    "total": 1000,
    "limit": 100,
    "offset": 0
  },
  "message": "Audit logs retrieved successfully"
}
```

---

## 5. PAYMENT ENDPOINTS

### 5.1 Create Razorpay Order
**POST** `/payment/razorpay/create-order`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "booking_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "order_123456789",
    "amount": 6000,
    "currency": "INR",
    "customer_name": "John Customer",
    "customer_email": "customer@example.com",
    "customer_phone": "+919876543210"
  },
  "message": "Razorpay order created successfully"
}
```

---

### 5.2 Verify Razorpay Payment
**POST** `/payment/razorpay/verify`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "order_id": "order_123456789",
  "payment_id": "pay_123456789",
  "signature": "signature_hash",
  "booking_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 5,
    "status": "confirmed"
  },
  "message": "Payment verified successfully"
}
```

---

### 5.3 Create Stripe Payment Intent
**POST** `/payment/stripe/create-intent`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "booking_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_123456789_secret_XXXXX",
    "intent_id": "pi_123456789",
    "amount": 6000,
    "currency": "inr",
    "customer_name": "John Customer"
  },
  "message": "Stripe payment intent created successfully"
}
```

---

### 5.4 Get Payment Status
**GET** `/payment/status/:booking_id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "payment_gateway": "razorpay",
    "amount": 6000,
    "payment_status": "completed",
    "payment_date": "2024-01-10T15:30:00Z",
    "payment_method": "upi"
  },
  "message": "Payment status retrieved successfully"
}
```

---

## Error Codes

- `MISSING_FIELDS` - Required fields not provided
- `INVALID_CREDENTIALS` - Invalid login credentials
- `INVALID_TOKEN` - Invalid or expired token
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks required permissions
- `NOT_FOUND` - Resource not found
- `INVALID_STATUS` - Invalid status value
- `INVALID_PRICE` - Invalid price value
- `INVALID_GUEST_COUNT` - Guest count exceeds capacity
- `OTP_DISABLED` - OTP feature is disabled
- `INVALID_OTP` - Invalid or expired OTP
- `PENDING_APPROVAL` - Manager account pending approval
- `RAZORPAY_DISABLED` - Razorpay not enabled
- `STRIPE_DISABLED` - Stripe not enabled
- `INVALID_SIGNATURE` - Payment verification failed
- `SERVER_ERROR` - Internal server error

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Auth endpoints: 5 requests per minute per IP

---

## Testing with cURL

### Test Developer Login
```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{
    "dev_id": "DEV001",
    "password": "password123"
  }'
```

### Test Customer Request OTP
```bash
curl -X POST http://localhost:3000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210"
  }'
```

### Test Get Hotels
```bash
curl -X GET "http://localhost:3000/api/customer/hotels?city=Mumbai"
```

### Test Create Booking (with auth)
```bash
curl -X POST http://localhost:3000/api/customer/bookings \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-17",
    "guest_count": 2
  }'
```

---

**API Version:** 1.0.0  
**Last Updated:** January 2024
