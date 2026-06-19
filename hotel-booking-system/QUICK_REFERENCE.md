# Hotel Booking System - Quick Reference Guide

## 🚀 5-Minute Quick Start

### Prerequisites
- Node.js 16+ installed
- MySQL 8.0+ running
- Git installed

### Step 1: Database Setup (2 min)
```bash
# Create database
mysql -u root -p
CREATE DATABASE hotel_booking_system;
EXIT;

# Import schema
mysql -u root -p hotel_booking_system < database/schema.sql
```

### Step 2: Backend Setup (2 min)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env - set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
npm run dev
```

**Server runs on:** `http://localhost:3000`

### Step 3: Test Connection (1 min)
```bash
# In another terminal
curl http://localhost:3000/health
```

---

## 📋 API Quick Reference

### Developer Login
```bash
POST /api/auth/developer/login
{
  "dev_id": "DEV001",
  "password": "AdminPass123!"
}
```

### Manager Login
```bash
POST /api/auth/manager/login
{
  "manager_id": "MGR001",
  "password": "password123"
}
```

### Customer OTP Login
```bash
# Step 1: Request OTP
POST /api/auth/customer/request-otp
{ "phone_number": "+919876543210" }

# Step 2: Verify OTP
POST /api/auth/customer/verify-otp
{
  "phone_number": "+919876543210",
  "otp_code": "123456"
}
```

### Browse Hotels (Public)
```bash
GET /api/customer/hotels?city=Mumbai&check_in=2024-01-15&check_out=2024-01-17
```

### Create Booking (Protected)
```bash
POST /api/customer/bookings
{
  "room_id": 1,
  "check_in_date": "2024-01-15",
  "check_out_date": "2024-01-17",
  "guest_count": 2
}
```

### Create Razorpay Order (Protected)
```bash
POST /api/payment/razorpay/create-order
{ "booking_id": 5 }
```

### Create Stripe Intent (Protected)
```bash
POST /api/payment/stripe/create-intent
{ "booking_id": 5 }
```

---

## 🗂️ File Structure Guide

```
backend/
├── server.js              Express app entry point
├── db.js                  MySQL connection pool
├── package.json           Dependencies
├── .env                   Configuration (create from .env.example)
│
├── middleware/
│   └── auth.js            JWT & role-based access control
│
├── routes/
│   ├── auth.js            Login endpoints (6 endpoints)
│   ├── developer.js        Super admin (12 endpoints)
│   ├── manager.js          Manager (10 endpoints)
│   ├── customer.js         Customer (8 endpoints)
│   └── payment.js          Payment (6 endpoints)
│
└── documentation/
    ├── SETUP_GUIDE.md     Installation guide
    └── API_DOCUMENTATION.md All endpoints
```

---

## 🔐 Authentication Headers

All protected endpoints require:
```bash
Authorization: Bearer {accessToken}
```

Example:
```bash
curl -X GET http://localhost:3000/api/manager/rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 💾 Database Quick Reference

### Check Tables
```sql
mysql> USE hotel_booking_system;
mysql> SHOW TABLES;
mysql> DESCRIBE bookings;
```

### View Sample Data
```sql
-- Developers
SELECT * FROM developers;

-- Hotels
SELECT * FROM hotels WHERE is_active = TRUE;

-- Bookings
SELECT * FROM bookings ORDER BY created_at DESC;

-- Payments
SELECT * FROM payments WHERE payment_status = 'completed';

-- Audit Logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### Check Room Availability
```sql
CALL CheckRoomAvailability(1, '2024-01-15', '2024-01-17', @available);
SELECT @available;
```

---

## 🔧 Environment Configuration

Create `backend/.env`:

```env
# Essential
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_booking_system

# JWT (generate unique secrets)
JWT_SECRET=your_super_secret_key_min_32_chars_long
REFRESH_TOKEN_SECRET=your_refresh_secret_min_32_chars_long

# Optional but recommended
RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX
```

---

## 🧪 Common Test Cases

### Test 1: Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"OK","timestamp":"..."}
```

### Test 2: Developer Login
```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{"dev_id":"DEV001","password":"AdminPass123!"}'
# Expected: accessToken, refreshToken, user object
```

### Test 3: Get Hotels (Public)
```bash
curl http://localhost:3000/api/customer/hotels
# Expected: Array of hotel objects
```

### Test 4: Get Manager's Rooms (Protected)
```bash
curl -X GET http://localhost:3000/api/manager/rooms \
  -H "Authorization: Bearer {accessToken}"
# Expected: Array of room objects for manager's hotel
```

### Test 5: Create Booking
```bash
curl -X POST http://localhost:3000/api/customer/bookings \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id":1,
    "check_in_date":"2024-01-15",
    "check_out_date":"2024-01-17",
    "guest_count":2
  }'
# Expected: Booking object with pending status
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check MySQL is running
mysql -u root -p
# Verify credentials in .env match
cat backend/.env | grep DB_
```

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### "JWT token invalid"
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiry (default: 7 days)
- Use refresh token to get new access token

### "Access Denied - Insufficient Permissions"
- Check Authorization header is included
- Verify correct role for endpoint
- Manager can only access own hotel's data
- Customer cannot access admin endpoints

### "Booking Conflict - Room Not Available"
- Room already booked for those dates
- Choose different dates or room
- Manager can check availability via SQL

---

## 📊 Role Endpoints Cheat Sheet

### Developer Only
```
GET    /api/developer/hotels
POST   /api/developer/hotels
PUT    /api/developer/hotels/:id
DELETE /api/developer/hotels/:id
GET    /api/developer/manager-requests
POST   /api/developer/manager-requests/:id/approve
POST   /api/developer/manager-requests/:id/reject
GET    /api/developer/settings
PUT    /api/developer/settings/:key
GET    /api/developer/analytics/dashboard
GET    /api/developer/analytics/payments
GET    /api/developer/audit-logs
```

### Manager Only
```
GET    /api/manager/rooms
POST   /api/manager/rooms
PUT    /api/manager/rooms/:id
PUT    /api/manager/rooms/:id/price
DELETE /api/manager/rooms/:id
GET    /api/manager/bookings
GET    /api/manager/bookings/:id
PUT    /api/manager/bookings/:id/status
GET    /api/manager/controls
GET    /api/manager/analytics
```

### Customer Only
```
GET    /api/customer/hotels                    (public)
GET    /api/customer/hotels/:id                (public)
POST   /api/customer/bookings
GET    /api/customer/bookings
GET    /api/customer/bookings/:id
PUT    /api/customer/bookings/:id/cancel
GET    /api/customer/profile
PUT    /api/customer/profile
```

### Payment (Any Authenticated User)
```
POST   /api/payment/razorpay/create-order
POST   /api/payment/razorpay/verify
POST   /api/payment/stripe/create-intent
GET    /api/payment/status/:booking_id
```

---

## 🔄 Common Data Flows

### Flow: New Booking → Payment → Confirmation
```
1. POST /api/customer/bookings
   → Returns booking_id, status="pending"

2. POST /api/payment/razorpay/create-order
   → Returns order_id

3. (Frontend) Open Razorpay modal
   → Customer pays

4. (Backend) Razorpay webhook
   → POST /api/payment/razorpay/webhook
   → Verify signature
   → Update booking status="confirmed"

5. Send confirmation to customer
```

### Flow: Manager Approves New Manager
```
1. New manager registers
   → Created with is_approved_by_developer=FALSE

2. Developer views requests
   → GET /api/developer/manager-requests

3. Developer approves
   → POST /api/developer/manager-requests/:id/approve

4. Manager now can login
   → POST /api/auth/manager/login
```

### Flow: Developer Controls Payment Feature
```
1. Developer disables online payments
   → PUT /api/developer/settings/online_payment_enabled
   → Value: false

2. Manager tries to create booking with payment
   → POST /api/payment/razorpay/create-order
   → ERROR: "Razorpay is not enabled"

3. Customers cannot pay
   → API returns: payment_enabled=false in booking response
```

---

## 🧠 Data Model Quick View

### Key Relationships
```
Developer
  ↓
Hotel (created by dev)
  ↓
Hotel Manager (assigned to hotel, approved by dev)
  ↓
Room (created by manager)
  ↓
Booking (created by customer)
  ↓
Payment (razorpay/stripe)
```

### Control Flow
```
Developer Settings (website_settings table)
  ↓
  ├→ Global feature toggles
  │   (online_payment_enabled, razorpay_enabled, etc.)
  │
  ↓
Manager Visibility
  ├→ Can see if feature is enabled
  ├→ Can manage own hotel's data
  │
  ↓
Customer Access
  ├→ Only if developer enabled
  ├→ Only if manager enabled for their hotel
```

---

## 📈 Important SQL Queries

### Get Active Hotels
```sql
SELECT id, name, city FROM hotels WHERE is_active = TRUE;
```

### Get Manager's Bookings
```sql
SELECT b.* FROM bookings b
JOIN rooms r ON b.room_id = r.id
WHERE r.hotel_id = {hotel_id}
ORDER BY b.check_in_date;
```

### Get Revenue by Gateway
```sql
SELECT payment_gateway, SUM(amount) as total
FROM payments
WHERE payment_status = 'completed'
GROUP BY payment_gateway;
```

### Check Booking Status History
```sql
SELECT * FROM booking_status_history
WHERE booking_id = {booking_id}
ORDER BY created_at;
```

### View All Audit Logs
```sql
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🚨 Error Codes Reference

| Code | Meaning | Solution |
|------|---------|----------|
| `MISSING_FIELDS` | Required fields not provided | Check request body |
| `INVALID_CREDENTIALS` | Wrong login credentials | Verify username/password |
| `UNAUTHORIZED` | No token provided | Add Authorization header |
| `FORBIDDEN` | Insufficient permissions | Check user role |
| `NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| `INVALID_OTP` | Wrong or expired OTP | Request new OTP |
| `INVALID_SIGNATURE` | Payment verification failed | Check payment gateway keys |
| `RAZORPAY_DISABLED` | Feature not enabled | Developer must enable it |
| `SERVER_ERROR` | Internal server error | Check server logs |

---

## 💡 Helpful Tips

1. **Use Postman** to test APIs before integrating in frontend
2. **Enable logging** - set NODE_ENV=development for detailed logs
3. **Check audit logs** - `SELECT * FROM audit_logs ORDER BY created_at DESC;`
4. **Test payment locally** - use Razorpay/Stripe test keys
5. **Monitor webhook logs** - `SELECT * FROM webhook_logs;`
6. **Use feature toggles** - control features via website_settings
7. **Check status history** - understand booking transitions
8. **Validate inputs** - frontend should validate before sending to API
9. **Use refresh tokens** - implement token refresh for better UX
10. **Log everything** - helps with debugging in production

---

## 📞 Support Resources

- **API Docs:** [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
- **Setup Guide:** [backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md)
- **Project Spec:** [PROJECT_SPEC.md](PROJECT_SPEC.md)
- **Development Summary:** [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md)
- **Main README:** [README.md](README.md)

---

## ✅ Pre-Launch Checklist

- [ ] Database schema imported
- [ ] .env file created with all variables
- [ ] npm install completed
- [ ] npm run dev starts without errors
- [ ] Health check endpoint responds
- [ ] Developer login works
- [ ] Customer can browse hotels
- [ ] Booking creation works
- [ ] Payment flow tested (at least one gateway)
- [ ] Audit logs record actions
- [ ] No console errors
- [ ] Postman collection tested
- [ ] Frontend ready for integration

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
