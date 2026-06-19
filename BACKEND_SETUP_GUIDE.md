# Hotel Booking System - Backend Setup Guide

## Prerequisites

- **Node.js** v14 or higher
- **MySQL** v8.0 or higher (or MariaDB)
- **npm** or **yarn** package manager

---

## 1. Database Setup

### Step 1: Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS my_website;
USE my_website;
```

### Step 2: Import Hotel Schema
```bash
mysql -u root -p my_website < HOTEL_SCHEMA.sql
```

**Verify tables created:**
```sql
SHOW TABLES;
```

You should see:
- developers
- managers
- hotels
- rooms
- customers
- bookings
- otp_logs
- feature_toggles
- hotel_toggles

---

## 2. Backend Installation

### Step 1: Navigate to Server Directory
```bash
cd server
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create .env File

Create `server/.env`:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=my_website

# JWT
JWT_SECRET=your-secret-key-change-in-production-please

# Razorpay (Optional - for real payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZOR_WEBHOOK_SECRET=your_webhook_secret

# Stripe (Optional - for real payments)
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Step 4: Update package.json (if needed)

Ensure these dependencies are installed:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "dotenv": "^16.0.3",
    "mysql2": "^3.1.0",
    "jsonwebtoken": "^9.0.0",
    "crypto": "^1.0.1",
    "razorpay": "^2.9.0"
  }
}
```

If missing, install:
```bash
npm install jsonwebtoken
```

---

## 3. Verify Database Connection

Create a test file `server/test-db.js`:
```javascript
const pool = require('./db');

async function test() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as ok');
    connection.release();
    console.log('✅ Database connected:', rows);
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

test();
```

Run:
```bash
node test-db.js
```

---

## 4. Start the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

Expected output:
```
Server listening on port 3000
```

### Production Mode:
```bash
npm start
```

---

## 5. Test API Endpoints

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok"}
```

### Test 2: Developer Login
```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{"dev_id":"DEV001","password":"dev123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "userRole": "developer",
  "user": {...}
}
```

### Test 3: Request OTP
```bash
curl -X POST http://localhost:3000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "otp_expiry_seconds": 600,
  "_dev_otp": "123456"
}
```

---

## 6. Frontend Integration

### Update Frontend Environment Variables

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3001`

---

## 7. Create Sample Data (Optional)

### Create a Sample Hotel

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/developer/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <developer_token>" \
  -d '{
    "name": "Grand Hotel",
    "city": "New York",
    "address": "123 Main St",
    "phone": "+1234567890",
    "email": "contact@grandhotel.com",
    "description": "Luxury 5-star hotel"
  }'
```

### Create Sample Rooms

```bash
curl -X POST http://localhost:3000/api/manager/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <manager_token>" \
  -d '{
    "room_number": "101",
    "room_type": "double",
    "capacity": 2,
    "price_per_night": 150.00,
    "description": "Spacious double room with city view",
    "amenities": ["WiFi", "AC", "TV", "Minibar"]
  }'
```

---

## 8. Default Credentials

### Developer
- **ID:** `DEV001`
- **Password:** `dev123`

### Manager (Create via Admin Panel)
- Contact developer to create manager account

### Customer
- Phone-based OTP login (no password)

---

## 9. Troubleshooting

### Issue: "Error: connect ECONNREFUSED 127.0.0.1:3306"
**Solution:** 
- Start MySQL service
- Windows: `net start MySQL80`
- Mac: `brew services start mysql`
- Linux: `sudo systemctl start mysql`

### Issue: "Error: Unknown database 'my_website'"
**Solution:**
```sql
CREATE DATABASE my_website;
mysql -u root my_website < HOTEL_SCHEMA.sql
```

### Issue: "Cannot find module 'jsonwebtoken'"
**Solution:**
```bash
npm install jsonwebtoken
```

### Issue: OTP showing as "[DEV]" in console
**Note:** This is normal for development. In production, integrate with SMS provider (Twilio, AWS SNS)

### Issue: "Access token required"
**Solution:** Check that Authorization header has correct token format: `Bearer <token>`

---

## 10. Project Structure

```
server/
├── index.js                 # Main server file
├── db.js                    # Database connection pool
├── package.json             # Dependencies
├── .env                     # Environment variables
├── middleware/
│   └── auth.js             # Authentication & authorization
├── routes/
│   ├── auth.js             # Login & OTP endpoints
│   ├── hotels.js           # Hotel management
│   ├── rooms.js            # Room management
│   ├── bookings.js         # Booking management
│   ├── payments.js         # Payment processing
│   └── admin.js            # Developer features
└── README_SERVER.md         # Original readme
```

---

## 11. API Testing Tools

### Using Postman
1. Import collection from BACKEND_API_DOCS.md
2. Set environment variable: `{{base_url}}` = `http://localhost:3000`
3. Test each endpoint

### Using Insomnia
1. Create requests manually from BACKEND_API_DOCS.md
2. Add Authorization header with Bearer token

### Using curl
See examples above in "Test API Endpoints" section

---

## 12. Production Deployment

### Requirements
- Node.js production environment
- SSL/TLS certificate (HTTPS)
- Dedicated database server
- Environment-specific .env file
- PM2 or similar process manager

### Steps
1. Set NODE_ENV=production in .env
2. Update JWT_SECRET to a strong random string
3. Use PM2: `npm install -g pm2 && pm2 start index.js`
4. Configure reverse proxy (Nginx/Apache)
5. Set up database backups

---

## 13. Security Best Practices

✅ **Implemented:**
- JWT token-based authentication
- Password hashing (SHA-256 - upgrade to bcrypt in production)
- Role-based access control (RBAC)
- Request validation

⚠️ **To Implement:**
- Rate limiting on OTP requests
- HTTPS/SSL encryption
- CORS whitelist (specific domains only)
- SQL injection prevention (parameterized queries already used)
- CSRF protection for sensitive operations
- Request logging and monitoring
- Regular security audits

---

**Setup Complete!** 🎉

Your hotel booking system backend is ready to run. Start the server and test the APIs!

**Next Steps:**
1. ✅ Database setup complete
2. ✅ Backend server setup
3. → Frontend integration
4. → End-to-end testing
5. → Deployment

---

**For API Documentation:** See [BACKEND_API_DOCS.md](./BACKEND_API_DOCS.md)
