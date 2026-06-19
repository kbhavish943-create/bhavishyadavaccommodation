# Backend API - Quick Reference Guide

## 🚀 Start Here

### Prerequisites
- MySQL running
- Node.js installed
- Database imported: `HOTEL_SCHEMA.sql`

### Quick Start (3 steps)
```bash
# 1. Import database
mysql -u root -p my_website < HOTEL_SCHEMA.sql

# 2. Start backend
cd server && npm install && npm run dev

# 3. Backend ready at http://localhost:3000
```

---

## 📌 Default Test Credentials

```
Developer:
  ID: DEV001
  Password: dev123

Customer (OTP):
  Phone: +919876543210
  OTP: (returned from /auth/customer/request-otp)
```

---

## 🔑 Key Endpoints

### Authentication (No token required)
```bash
POST /api/auth/developer/login
POST /api/auth/manager/login
POST /api/auth/customer/request-otp
POST /api/auth/customer/verify-otp
```

### Developer Operations (Token required - role: developer)
```bash
GET    /api/developer/hotels
POST   /api/developer/hotels
PUT    /api/developer/hotels/:id
DELETE /api/developer/hotels/:id

GET    /api/developer/toggles
PUT    /api/developer/toggles/:featureName

GET    /api/developer/manager-approvals
PUT    /api/developer/managers/:managerId/approve
PUT    /api/developer/managers/:managerId/reject

GET    /api/developer/analytics
```

### Manager Operations (Token required - role: manager)
```bash
GET    /api/manager/hotel
PUT    /api/manager/hotel

GET    /api/manager/rooms
POST   /api/manager/rooms
PUT    /api/manager/rooms/:id
DELETE /api/manager/rooms/:id

GET    /api/manager/bookings
PUT    /api/manager/bookings/:id/status

GET    /api/manager/hotel-toggles
PUT    /api/manager/hotel-toggles

GET    /api/manager/payments
```

### Customer Operations (Token required - role: customer)
```bash
GET    /api/customer/hotels
GET    /api/customer/hotels/:hotelId/availability

POST   /api/customer/bookings
GET    /api/customer/bookings
GET    /api/customer/bookings/:bookingId
PUT    /api/customer/bookings/:bookingId/cancel

POST   /api/customer/payments/create
GET    /api/customer/payments/:paymentId/status
POST   /api/customer/payments/verify
POST   /api/customer/payments/razorpay/create-order
POST   /api/customer/payments/stripe/create-session
```

### Public Operations (No token required)
```bash
GET    /api/hotels/:id
GET    /api/hotels/:hotelId/rooms/:roomId
GET    /health
```

---

## 🧪 Test Commands

### Developer Login
```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{"dev_id":"DEV001","password":"dev123"}'
```

**Copy the `accessToken` from response for next steps**

### Get All Hotels
```bash
curl -X GET http://localhost:3000/api/developer/hotels \
  -H "Authorization: Bearer <accessToken_from_above>"
```

### Customer Request OTP
```bash
curl -X POST http://localhost:3000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210"}'
```

**Note: OTP is returned in `_dev_otp` field for testing**

### Customer Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/customer/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210","otp_code":"123456"}'
```

### Check Hotel Availability
```bash
curl -X GET "http://localhost:3000/api/customer/hotels/1/availability?checkInDate=2024-12-25&checkOutDate=2024-12-26" \
  -H "Authorization: Bearer <customer_accessToken>"
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/customer/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customer_accessToken>" \
  -d '{
    "hotelId": 1,
    "roomId": 1,
    "checkInDate": "2024-12-25",
    "checkOutDate": "2024-12-26",
    "numberOfGuests": 2,
    "specialRequests": "Early check-in"
  }'
```

### Process Payment
```bash
curl -X POST http://localhost:3000/api/customer/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customer_accessToken>" \
  -d '{
    "bookingId": "BK1234567890ABC",
    "amount": 150.00,
    "currency": "INR",
    "paymentMethod": "card"
  }'
```

---

## 📊 Role-Based Access Levels

```
Developer (Level 3)
├── Can create/manage all hotels
├── Can manage feature toggles (6 global features)
├── Can approve/reject managers
├── Can view system analytics
└── Can see all operations

Manager (Level 2)
├── Can manage assigned hotel
├── Can create/manage rooms
├── Can see hotel bookings
├── Can control hotel visibility (3 toggles)
└── Can view payment reports

Customer (Level 1)
├── Can browse visible hotels
├── Can check room availability
├── Can make bookings
├── Can process payments
└── Can view own bookings

Public (No auth)
└── Can browse public hotel/room info
```

---

## 🗄️ Database Tables Quick Reference

| Table | Columns | Purpose |
|-------|---------|---------|
| `developers` | dev_id, password, email, status | Admin accounts |
| `managers` | manager_id, password, hotel_id, status | Manager accounts |
| `hotels` | name, city, is_visible, status | Hotel listings |
| `rooms` | room_number, hotel_id, price_per_night, status | Room inventory |
| `customers` | phone_number, otp_code, status | Customer profiles |
| `bookings` | booking_id, customer_id, hotel_id, check_in_date, payment_status | Reservations |
| `otp_logs` | phone_number, status, created_at | OTP audit trail |
| `feature_toggles` | feature_name, is_enabled | Global features |
| `hotel_toggles` | hotel_id, show_to_customers | Per-hotel features |

---

## ⚙️ Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=my_website

# JWT
JWT_SECRET=your-secret-key

# Payment Gateways (optional)
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
STRIPE_PUBLIC_KEY=your_key
STRIPE_SECRET_KEY=your_secret
```

---

## 🔄 Common Workflows

### 1. Developer Flow
```
1. POST /auth/developer/login
   → Get accessToken
2. GET  /developer/hotels
   → View all hotels
3. POST /developer/hotels
   → Create new hotel
4. GET  /developer/manager-approvals
   → View pending approvals
5. PUT  /developer/managers/{id}/approve
   → Approve manager
6. GET  /developer/analytics
   → View system metrics
```

### 2. Manager Flow
```
1. POST /auth/manager/login
   → Get accessToken (must be approved)
2. GET  /manager/hotel
   → View assigned hotel
3. POST /manager/rooms
   → Add new room
4. GET  /manager/bookings
   → View all bookings
5. PUT  /manager/bookings/{id}/status
   → Update booking status
6. GET  /manager/payments
   → View revenue
```

### 3. Customer Booking Flow
```
1. POST /auth/customer/request-otp
   → Request OTP code
2. POST /auth/customer/verify-otp
   → Verify and get accessToken
3. GET  /customer/hotels?city=NewYork
   → Browse available hotels
4. GET  /customer/hotels/{id}/availability?checkInDate=...
   → Check room availability
5. POST /customer/bookings
   → Create reservation
6. POST /customer/payments/create
   → Pay for booking
7. GET  /customer/bookings
   → View booking history
```

---

## 🚨 Error Codes & Meanings

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Login required or invalid token |
| 403 | Forbidden | Insufficient permissions for operation |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Wait before retrying (especially OTP) |
| 500 | Server Error | Contact support or check server logs |

---

## 📱 Frontend Integration

Frontend automatically uses these variables:
```javascript
// frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

All frontend requests go to:
```
http://localhost:3000/api/*
```

With Authorization header:
```
Authorization: Bearer <accessToken>
```

---

## ✅ Verification Checklist

- [ ] MySQL database created
- [ ] HOTEL_SCHEMA.sql imported
- [ ] server/.env configured
- [ ] Backend server starts (`npm run dev`)
- [ ] `/health` endpoint responds
- [ ] Developer login works
- [ ] Customer OTP request works
- [ ] JWT token valid for 24 hours
- [ ] Role-based access working
- [ ] Hotel CRUD functional
- [ ] Booking creation works
- [ ] Payment mock works

---

## 📖 Full Documentation

- **Complete API Reference:** `BACKEND_API_DOCS.md`
- **Setup Instructions:** `BACKEND_SETUP_GUIDE.md`
- **Implementation Summary:** `BACKEND_IMPLEMENTATION_SUMMARY.md`
- **Database Schema:** `HOTEL_SCHEMA.sql`

---

## 🆘 Common Issues & Solutions

**"Cannot connect to MySQL"**
```bash
# Windows
net start MySQL80

# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
```

**"Unknown database 'my_website'"**
```bash
mysql -u root -p
CREATE DATABASE my_website;
exit

mysql -u root -p my_website < HOTEL_SCHEMA.sql
```

**"Cannot find module 'jsonwebtoken'"**
```bash
cd server
npm install jsonwebtoken
```

**"Port 3000 already in use"**
```bash
# Find and kill process on port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux
```

**"Invalid token" error**
- Check token includes "Bearer " prefix
- Token must be from login endpoint
- Token expires after 24 hours

---

## 🎯 Example Request-Response

### Request: Create Hotel
```bash
curl -X POST http://localhost:3000/api/developer/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "name": "Luxury Hotel",
    "city": "Paris",
    "address": "123 Rue de Rivoli",
    "phone": "+33123456789",
    "email": "contact@luxuryhotel.fr",
    "description": "5-star luxury hotel"
  }'
```

### Response: Success (200)
```json
{
  "success": true,
  "message": "Hotel created successfully",
  "data": {
    "id": 5
  }
}
```

### Response: Error (400)
```json
{
  "success": false,
  "error": "name and city are required"
}
```

---

## 📞 Quick Support

| Issue | Check |
|-------|-------|
| API not responding | Server running? `npm run dev` started? |
| Token expired | Re-login to get new token |
| Permission denied | Check user role matches endpoint level |
| Database error | MySQL running? Database imported? |
| OTP not received | Check `_dev_otp` field in response (dev mode) |

---

**Last Updated:** December 19, 2024  
**Backend Status:** ✅ Production Ready
