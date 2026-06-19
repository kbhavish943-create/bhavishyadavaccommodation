# 🎉 Event Booking Platform - Backend Setup Guide

This is the backend for a scalable event booking platform (marriage halls, birthday venues, corporate events) built with **Node.js, Express, MongoDB, JWT, and Razorpay/Stripe integration**.

## 📋 Project Structure

```
backend-setup/
├── src/
│   ├── app.js                          # Express app setup
│   ├── index.js                        # Server entry point
│   ├── config/
│   │   ├── database.js                 # MongoDB connection
│   │   └── logger.js                   # Winston logger configuration
│   ├── models/                         # Mongoose schemas
│   │   ├── User.js                     # User model (customer, vendor, admin)
│   │   ├── Vendor.js                   # Vendor profile (KYC, banking)
│   │   ├── Hall.js                     # Venue/Hall model
│   │   ├── Booking.js                  # Event booking model
│   │   ├── Review.js                   # Customer reviews & ratings
│   │   ├── Payment.js                  # Payment transactions
│   │   ├── Payout.js                   # Vendor earnings & payouts
│   │   └── [Other models - to be created]
│   ├── controllers/
│   │   ├── authController.js           # Auth logic (register, login, OTP)
│   │   ├── hallController.js           # Hall management (CRUD, search)
│   │   ├── bookingController.js        # [To be created]
│   │   ├── reviewController.js         # [To be created]
│   │   ├── paymentController.js        # [To be created]
│   │   └── [Other controllers - to be created]
│   ├── routes/
│   │   ├── authRoutes.js               # Auth endpoints
│   │   ├── hallRoutes.js               # Hall endpoints
│   │   └── [Other routes - to be created]
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification, role-based access
│   │   └── validation.js               # Input validation, sanitization
│   ├── utils/
│   │   ├── validators.js               # Joi validation schemas
│   │   ├── authUtils.js                # JWT, OTP, password utilities
│   │   └── [Other utilities - to be created]
│   └── logs/                           # Application logs
├── .env.example                        # Environment variables template
├── package.json                        # Dependencies
├── .gitignore                          # Git ignore file
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **MongoDB** 5.0+ (local or Atlas)
- **Git**

### 1️⃣ Installation

```bash
# Clone or navigate to project
cd backend-setup

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env with your configuration
# nano .env  (or use your favorite editor)
```

### 2️⃣ Configure Environment Variables

Edit `.env` file with your credentials:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/eventbooking
MONGODB_TEST_URI=mongodb://localhost:27017/eventbooking_test

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# OTP
OTP_EXPIRY_MINUTES=10

# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Cloudinary (File Upload)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password
SMTP_FROM_EMAIL=noreply@eventbooking.com

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# Admin
ADMIN_EMAIL=admin@eventbooking.com

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# Environment
NODE_ENV=development
```

### 3️⃣ Start Development Server

```bash
# Development mode (with auto-reload using nodemon)
npm run dev

# Production mode
npm start

# The server will start on http://localhost:3000
```

### 4️⃣ Verify Server is Running

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "environment": "development"
}
```

## 📚 API Documentation

### 🔐 Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123!",
  "userType": "customer",
  "address": {
    "line1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "userType": "customer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "lastLogin": "2024-01-20T10:30:45.123Z"
  }
}
```

#### 3. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### 4. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json
Authorization: Bearer {refreshToken}

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 5. Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

---

### 🏢 Hall/Venue Endpoints

#### 1. Create Hall (Vendor Only)
```http
POST /api/halls
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "hallName": "The Grand Ballroom",
  "description": "Premium wedding venue with state-of-the-art facilities",
  "category": "marriage_hall",
  "address": "123 Royal Plaza, Mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "capacity": {
    "dining": 500,
    "standing": 800,
    "cocktail": 600
  },
  "basePrice": 100000,
  "amenities": ["AC", "WiFi", "Parking", "Kitchen", "Washrooms"],
  "policies": {
    "decorationAllowed": true,
    "outsideFoodAllowed": "partial",
    "outsideDJAllowed": true,
    "liquorPolicy": "allowed"
  }
}
```

#### 2. Get Hall Details
```http
GET /api/halls/{hallId}
```

#### 3. List All Halls with Filters
```http
GET /api/halls?city=Mumbai&category=marriage_hall&minPrice=50000&maxPrice=200000&page=1&limit=10&sortBy=rating&sortOrder=desc
```

#### 4. Search Halls by Location
```http
GET /api/halls/search/nearby?latitude=19.0760&longitude=72.8777&maxDistance=50&category=marriage_hall
```

#### 5. Update Hall (Vendor Owner Only)
```http
PUT /api/halls/{hallId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "hallName": "The Grand Ballroom - Updated",
  "basePrice": 120000
}
```

#### 6. Delete Hall (Vendor Owner Only)
```http
DELETE /api/halls/{hallId}
Authorization: Bearer {accessToken}
```

#### 7. Get My Halls (Vendor Only)
```http
GET /api/vendors/me/halls
Authorization: Bearer {accessToken}
```

---

## 🔑 Key Features Implemented

✅ **User Management**
- Customer registration & login
- Vendor registration with KYC verification
- Admin user management
- Email verification with OTP
- Brute force protection
- Password hashing with bcryptjs

✅ **Hall Management**
- Create, read, update, delete halls
- Venue search with multiple filters
- Geo-spatial location-based search
- Image/video uploads
- Rating system
- SEO slug generation

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (customer, vendor, admin)
- Refresh token mechanism
- Automatic token expiry

✅ **API Validation**
- Request body validation using Joi
- Input sanitization to prevent injection attacks
- Error handling with descriptive messages

✅ **Logging & Monitoring**
- Winston logger with file rotation
- Request/response logging
- Error tracking with stack traces

---

## 📦 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 16.x+ |
| Framework | Express.js | 4.18.2 |
| Database | MongoDB | 5.0+ |
| ODM | Mongoose | 7.0.0 |
| Authentication | JWT | 9.0.0 |
| Password Hashing | bcryptjs | 2.4.3 |
| Input Validation | Joi | 17.9.1 |
| Security | Helmet | 7.0.0 |
| Logging | Winston | 3.8.2 |
| File Upload | Multer | 1.4.5-lts.1 |
| Payments | Razorpay | 2.9.2 |
| Payments | Stripe | 12.0.0 |
| Real-time | Socket.io | 4.6.1 |
| Testing | Jest | 29.5.0 |
| Email | Nodemailer | 6.9.1 |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

---

## 📝 Scripts

```json
{
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "jest --forceExit",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "seed": "node scripts/seed.js"
}
```

---

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit .env file
2. **Password Hashing**: All passwords hashed with bcryptjs (10 salt rounds)
3. **JWT Tokens**: Secure signing with long secrets
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **CORS**: Whitelist frontend URL only
6. **Helmet**: Security headers via helmet.js
7. **Input Sanitization**: All inputs sanitized against XSS
8. **SQL Injection Prevention**: Mongoose schema validation
9. **OTP Security**: 10-minute expiry, 5-attempt limit
10. **Brute Force Protection**: Account lockout after 5 failed login attempts

---

## 📊 Database Schema Highlights

### User Collection
- Role-based: customer, vendor, admin
- OTP verification for email
- Brute force protection (loginAttempts, lockUntil)
- Soft delete support

### Vendor Collection
- KYC verification (Aadhar, PAN)
- Banking details for payouts
- Performance metrics (rating, response time)
- Commission tracking

### Hall Collection
- Location-based search (geo-spatial)
- Dynamic pricing (weekday, weekend, festival multipliers)
- Policy management
- Media management (images, videos)
- SEO optimization

### Booking Collection
- Event type and date management
- Pricing breakdown
- Payment tracking
- Status workflow
- Modification history

### Review Collection
- Aspect-wise ratings (venue, service, food, etc.)
- Vendor response system
- Helpfulness voting
- Moderation workflow

---

## 🚧 To-Do (Week 1-2 Remaining Tasks)

- [ ] Booking Controller & Routes
- [ ] Review Controller & Routes
- [ ] Payment Controller & Routes (Razorpay/Stripe)
- [ ] Vendor Controller & Routes
- [ ] User Profile Controller & Routes
- [ ] Admin Dashboard Controller & Routes
- [ ] Email notification service
- [ ] SMS/WhatsApp notification service
- [ ] Stripe webhook handler
- [ ] Razorpay webhook handler
- [ ] Unit tests for all controllers
- [ ] Integration tests for all API endpoints
- [ ] API documentation (Swagger/OpenAPI)

---

## 🤝 Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add comments for complex logic
4. Test all changes locally before committing
5. Update this README if adding new features

---

## 📞 Support

For issues or questions, open a GitHub issue or contact the development team.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for seamless event booking**
