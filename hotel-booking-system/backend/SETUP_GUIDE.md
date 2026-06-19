# Hotel Booking System - Backend Setup Guide

## Prerequisites

- **Node.js:** Version 16+ ([Download](https://nodejs.org/))
- **MySQL:** Version 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **npm:** Comes with Node.js
- **Git:** For version control

---

## Step 1: Clone & Install Dependencies

```bash
# Navigate to backend directory
cd hotel-booking-system/backend

# Install npm packages
npm install
```

**Packages installed:**
- `express` - Web framework
- `mysql2` - MySQL driver with promise support
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variable management
- `razorpay` - Razorpay payment gateway
- `stripe` - Stripe payment gateway

---

## Step 2: Database Setup

### 2.1 Create Database & User

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hotel_booking_system;
CREATE USER 'hotel_user'@'localhost' IDENTIFIED BY 'hotel_password';
GRANT ALL PRIVILEGES ON hotel_booking_system.* TO 'hotel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Import Database Schema

```bash
# Navigate to project root (where schema.sql is located)
cd ../..

# Import schema
mysql -u hotel_user -p hotel_booking_system < hotel-booking-system/database/schema.sql

# Verify tables were created
mysql -u hotel_user -p hotel_booking_system -e "SHOW TABLES;"
```

---

## Step 3: Environment Configuration

### 3.1 Create .env File

```bash
cd backend

# Copy the example file
cp .env.example .env
```

### 3.2 Configure .env Variables

Edit `backend/.env` with your settings:

```env
# SERVER
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# DATABASE
DB_HOST=localhost
DB_USER=hotel_user
DB_PASSWORD=hotel_password
DB_NAME=hotel_booking_system

# JWT
JWT_SECRET=your_super_secret_key_change_in_production_min_32_chars
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=your_refresh_secret_change_in_production_min_32_chars

# RAZORPAY (Optional - for testing use test keys)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=webhook_secret_from_dashboard

# STRIPE (Optional - for testing use test keys)
STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX

# OPTIONAL - OTP/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=app_password
SMTP_FROM=noreply@hotelbooking.com
```

---

## Step 4: Running the Server

### Development Mode (with auto-reload)

```bash
cd backend
npm run dev
```

Expected output:
```
╔════════════════════════════════════════════╗
║   HOTEL BOOKING SYSTEM - BACKEND SERVER   ║
╠════════════════════════════════════════════╣
║  Server running on http://localhost:3000   ║
║  Environment: development                   ║
║  Database: hotel_booking_system             ║
╠════════════════════════════════════════════╣
║  AVAILABLE ENDPOINTS:                      ║
║  • POST /api/auth/developer/login          ║
║  • POST /api/auth/manager/login            ║
║  • POST /api/auth/customer/request-otp     ║
║  • POST /api/auth/customer/verify-otp      ║
║  • GET  /api/developer/*                   ║
║  • GET  /api/manager/*                     ║
║  • GET  /api/customer/*                    ║
║  • POST /api/payment/*                     ║
╚════════════════════════════════════════════╝
```

### Production Mode

```bash
npm start
```

---

## Step 5: Test the API

### 5.1 Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-10T10:00:00.000Z"
}
```

### 5.2 Test Developer Login

```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{
    "dev_id": "DEV001",
    "password": "AdminPass123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

### 5.3 Test Customer Hotel Search

```bash
curl -X GET "http://localhost:3000/api/customer/hotels?city=Mumbai"
```

### 5.4 Request OTP

```bash
curl -X POST http://localhost:3000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210"
  }'
```

---

## Step 6: Integration with Frontend

### Configure Frontend .env.local

```env
# Frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXX
```

### Update API Base URL in Frontend

Edit `frontend/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

---

## Database Schema Overview

### Core Tables

1. **developers** - Super admin accounts (Developer role)
2. **website_settings** - Global configuration toggles
3. **hotels** - Hotel listings
4. **hotel_managers** - Manager accounts linked to hotels
5. **rooms** - Rooms in each hotel
6. **customers** - Customer accounts (phone-based, no password)
7. **bookings** - Room bookings
8. **payments** - Payment records
9. **booking_status_history** - Booking status change audit trail
10. **audit_logs** - All user actions for compliance
11. **webhook_logs** - Payment gateway webhook records

### Key Views

- `hotel_manager_view` - Manager with hotel info
- `booking_details_view` - Complete booking information
- `payment_summary_view` - Payment aggregates

### Stored Procedures

- `UpdateBookingStatus()` - Update status with history tracking
- `CheckRoomAvailability()` - Verify room availability for date range

---

## Payment Gateway Setup

### Razorpay Setup

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Get API Keys from Settings → API Keys
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_XXXXX
   RAZORPAY_KEY_SECRET=XXXXX
   ```
4. Configure webhook URL:
   - Go to Settings → Webhooks
   - Add: `https://your-domain.com/api/payment/razorpay/webhook`
   - Events: `payment.authorized`, `payment.failed`

### Stripe Setup

1. Create account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API Keys from Developers → API Keys
3. Add to `.env`:
   ```env
   STRIPE_PUBLIC_KEY=pk_test_XXXXX
   STRIPE_SECRET_KEY=sk_test_XXXXX
   ```
4. Configure webhook:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/payment/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

---

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify DB user exists
mysql -u root -p -e "SELECT user FROM mysql.user;"

# Check .env database credentials
cat backend/.env | grep DB_
```

### Issue: Port 3000 Already In Use

**Solution:**
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux: Kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: CORS Error

**Solution:**
- Ensure `FRONTEND_URL` in `.env` matches frontend origin
- Default: `http://localhost:3001`
- Check browser console for exact error

### Issue: JWT Token Invalid

**Solution:**
- Ensure `JWT_SECRET` is set and consistent
- Token expires after time in `JWT_EXPIRY`
- Use refresh token to get new access token

### Issue: Email Notifications Not Sending

**Solution:**
- Verify SMTP credentials in `.env`
- For Gmail: Use [App Passwords](https://support.google.com/accounts/answer/185833)
- Check SMTP_FROM email format

---

## Development Best Practices

### 1. Always Use Environment Variables

```javascript
// ✓ Good
const dbPassword = process.env.DB_PASSWORD;

// ✗ Bad
const dbPassword = 'hardcoded_password';
```

### 2. Implement Proper Error Handling

```javascript
router.get('/endpoint', async (req, res) => {
  try {
    // Your code
    return sendSuccess(res, data, 'Success message');
  } catch (error) {
    console.error('Error:', error);
    return sendError(res, 500, 'Error message', 'ERROR_CODE');
  }
});
```

### 3. Log All Important Actions

```javascript
// Log user actions for audit trail
await pool.execute(
  'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
  ['customer', userId, 'create_booking', 'booking', bookingId]
);
```

### 4. Validate Input Data

```javascript
if (!booking_id || !room_id || !check_in_date) {
  return sendError(res, 400, 'Missing required fields', 'MISSING_FIELDS');
}
```

### 5. Use Middleware for Authentication

```javascript
router.get('/protected', authenticateToken, requireManager, (req, res) => {
  // This route requires manager role
});
```

---

## Performance Optimization

### Database Query Optimization

- Use proper indexes (15+ already created)
- Avoid N+1 queries - use joins
- Implement pagination for large result sets

### Caching

- Cache frequently accessed data (hotels, settings)
- Use Redis for session caching (optional)
- Cache payment gateway responses

### Rate Limiting

- Implement rate limiting on auth endpoints
- 5 requests per minute for login
- 100 requests per minute for others

---

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Keep npm packages updated (`npm audit`)
- [ ] Validate all user inputs
- [ ] Use prepared statements (already using mysql2)
- [ ] Implement rate limiting
- [ ] Monitor audit logs regularly
- [ ] Use strong database password
- [ ] Enable webhook signature verification
- [ ] Implement CSRF protection if using sessions

---

## Deployment

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create hotel-booking-api

# Set environment variables
heroku config:set DB_HOST=your-db-host
heroku config:set DB_USER=your-db-user
# ... set all other variables

# Deploy
git push heroku main
```

### Deploy to AWS/DigitalOcean

- Use PM2 for process management
- Configure Nginx as reverse proxy
- Use Let's Encrypt for SSL
- Set up monitoring and logging

---

## Useful Commands

```bash
# Run tests
npm test

# Run with production environment
NODE_ENV=production npm start

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

**Next Steps:**
1. ✅ Backend API running
2. → Frontend development (See FRONTEND_SETUP.md)
3. → Payment gateway testing
4. → Deployment to production

**Support:** For issues, check API_DOCUMENTATION.md or common error codes section above.

**Last Updated:** January 2024
