# Hotel Listing & Booking Website

## 🏨 Project Overview

A **production-ready hotel booking platform** with three-tier role-based access control:

- **Developer (Super Admin)** - Full system control, analytics, hotel management
- **Hotel Manager** - Individual hotel control, room pricing, booking management
- **Customer** - Book hotels with OTP-based login (no password required)

### Key Features

✅ **Three Distinct Authentication Systems**

- Developer login with secure password
- Manager login per hotel with approval workflow
- Customer login via OTP (SMS/Email)

✅ **Payment Integration**

- Razorpay (UPI, Cards, Wallet)
- Stripe (International Cards)
- Webhook-based payment verification
- Automatic booking confirmation

✅ **Role-Based Control Hierarchy**

- Developer controls all hotels and managers
- Manager controls own hotel rooms and bookings
- Customer can only see enabled hotels/rooms
- Feature toggles controlled by developer

✅ **Booking Management**

- Real-time room availability checking
- Booking status history with audit trail
- Automatic conflict prevention with stored procedures
- Cancellation & refund management

✅ **Analytics & Reporting**

- Developer dashboard with system-wide metrics
- Manager dashboard with hotel-specific analytics
- Payment analytics by gateway and date
- Audit logs for compliance

✅ **Hotel & Room Management**

- Create/edit/delete hotels
- Dynamic room management
- Flexible pricing per room
- Amenities and photo storage

---

## 📁 Project Structure

```bash
hotel-booking-system/
├── backend/                    # Express.js API Server
│   ├── middleware/
│   │   └── auth.js            # JWT & Role-based access control
│   ├── routes/
│   │   ├── auth.js            # Login endpoints for all 3 roles
│   │   ├── developer.js        # Super admin endpoints
│   │   ├── manager.js          # Manager endpoints
│   │   ├── customer.js         # Customer endpoints
│   │   └── payment.js          # Razorpay & Stripe integration
│   ├── db.js                   # MySQL connection pool
│   ├── server.js               # Express app entry point
│   ├── package.json
│   ├── .env.example            # Environment template
│   ├── API_DOCUMENTATION.md    # Complete API reference
│   └── SETUP_GUIDE.md          # Backend setup instructions
│
├── database/
│   └── schema.sql              # MySQL schema with 10 tables, 3 views, 2 procedures
│
├── frontend/                   # Next.js React Application
│   ├── pages/
│   │   ├── developer/          # Developer dashboard
│   │   ├── manager/            # Manager dashboard
│   │   ├── customer/           # Customer booking interface
│   │   └── auth/               # Login pages for all 3 roles
│   ├── components/             # Reusable React components
│   ├── lib/                    # Utility functions
│   ├── styles/                 # Tailwind CSS
│   └── package.json
│
├── PROJECT_SPEC.md             # Complete project specification
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Backend Setup (5 minutes)

```bash
# 1. Create MySQL database
mysql -u root -p
CREATE DATABASE hotel_booking_system;
EXIT;

# 2. Import schema
mysql -u root -p hotel_booking_system < database/schema.sql

# 3. Install and run server
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

**Server will start at:** `http://localhost:3000`

### Frontend Setup (5 minutes)

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Create .env.local
cp .env.example .env.local
# Configure Firebase and API URL

# 3. Run development server
npm run dev
```

**Frontend will start at:** `http://localhost:3001`

---

## 🔐 Three-Tier Authentication

### 1️⃣ Developer Login

**Role:** Super Admin with full system control

**Endpoint:** `POST /api/auth/developer/login`

```bash
curl -X POST http://localhost:3000/api/auth/developer/login \
  -H "Content-Type: application/json" \
  -d '{
    "dev_id": "DEV001",
    "password": "AdminPass123!"
  }'
```

**Default Credentials:** (Set during database initialization)

- Dev ID: `DEV001`
- Password: Check `schema.sql` for default hash

**Access:**

- All hotels and managers
- System settings and feature toggles
- Analytics and audit logs
- Manager approval/rejection
- Hotel CRUD operations

---

### 2️⃣ Manager Login

**Role:** Hotel-specific management

**Endpoint:** `POST /api/auth/manager/login`

```bash
curl -X POST http://localhost:3000/api/auth/manager/login \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": "MGR001",
    "password": "password123"
  }'
```

**Requirements:**

- Must be approved by developer
- Associated with specific hotel
- Cannot access other hotels' data
- Can only manage own hotel's rooms and bookings

**Access:**

- Room CRUD and pricing
- Booking management and status updates
- Hotel-specific analytics
- Payment toggles (if developer allows)

---

### 3️⃣ Customer Login

**Role:** End user booking platform

**Step 1:** Request OTP

```bash
curl -X POST http://localhost:3000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210"
  }'
```

**Step 2:** Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/customer/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210",
    "otp_code": "123456"
  }'
```

**Features:**

- No password required (OTP-based)
- Browse all available hotels
- Check room availability
- Create and manage bookings
- Online payment with Razorpay/Stripe

---

## 💳 Payment Integration

### Razorpay Payment Flow

```text
1. Customer selects room and creates booking (status: pending)
2. POST /api/payment/razorpay/create-order → Returns order_id
3. Frontend opens Razorpay modal
4. Customer pays via UPI/Card/Wallet
5. Razorpay webhook → POST /api/payment/razorpay/webhook
6. Server verifies signature → Updates booking to confirmed
7. Customer receives confirmation
```

### Stripe Payment Flow

```text
1. Customer selects room and creates booking (status: pending)
2. POST /api/payment/stripe/create-intent → Returns client_secret
3. Frontend uses Stripe.js for card collection
4. POST to /api/payment/stripe/confirm-intent
5. Stripe webhook → POST /api/payment/stripe/webhook
6. Server updates booking to confirmed
7. Customer receives confirmation
```

### Configuration

**Razorpay:**

```env
RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=XXXXX
RAZORPAY_WEBHOOK_SECRET=webhook_secret
```

**Stripe:**

```env
STRIPE_PUBLIC_KEY=pk_test_XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX
```

---

## 📊 Database Schema

### 10 Core Tables

| Table | Purpose |
| ----- | ------- |
| `developers` | Super admin accounts |
| `website_settings` | Global configuration toggles |
| `hotels` | Hotel listings |
| `hotel_managers` | Manager-to-hotel mappings |
| `rooms` | Rooms in hotels |
| `customers` | Customer accounts |
| `bookings` | Room reservations |
| `payments` | Payment records |
| `booking_status_history` | Audit trail for booking changes |
| `audit_logs` | All user actions for compliance |
| `webhook_logs` | Payment gateway events |

### Key Views

- `hotel_manager_view` - Manager with hotel details
- `booking_details_view` - Complete booking information with customer/room/hotel data
- `payment_summary_view` - Payment aggregates and statistics

### Stored Procedures

#### UpdateBookingStatus

- Updates booking status safely
- Automatically records status change history
- Called when payment is verified or status is changed manually

#### CheckRoomAvailability

- Prevents double-booking with date range checking
- Used during booking creation to verify availability
- Considers pending and confirmed bookings

---

## 🔧 Configuration & Settings

### Developer-Controlled Feature Toggles

All toggles are in `website_settings` table and can be updated via API:

| Setting | Default | Purpose |
| ------- | ------- | ------- |
| `online_payment_enabled` | true | Enable/disable online payments globally |
| `razorpay_enabled` | true | Enable Razorpay payment gateway |
| `stripe_enabled` | true | Enable Stripe payment gateway |
| `otp_enabled` | true | Enable OTP-based customer login |
| `email_notifications_enabled` | true | Send email confirmations |
| `sms_notifications_enabled` | false | Send SMS notifications |

### Update Setting (Developer Only)

```bash
curl -X PUT http://localhost:3000/api/developer/settings/razorpay_enabled \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{ "value": false }'
```

---

## 📚 API Endpoints Summary

### Authentication (Public)

```bash
POST   /api/auth/developer/login
POST   /api/auth/manager/login
POST   /api/auth/customer/request-otp
POST   /api/auth/customer/verify-otp
POST   /api/auth/refresh-token
POST   /api/auth/logout
```

### Customer (Public + Protected)

```bash
GET    /api/customer/hotels                        # Public - browse hotels
GET    /api/customer/hotels/:id                    # Public - hotel details
POST   /api/customer/bookings                      # Protected - create booking
GET    /api/customer/bookings                      # Protected - my bookings
GET    /api/customer/bookings/:id                  # Protected - booking details
PUT    /api/customer/bookings/:id/cancel           # Protected - cancel booking
GET    /api/customer/profile                       # Protected
PUT    /api/customer/profile                       # Protected
```

### Manager (Protected)

```bash
GET    /api/manager/rooms                          # Get hotel's rooms
POST   /api/manager/rooms                          # Create room
PUT    /api/manager/rooms/:id                      # Update room
PUT    /api/manager/rooms/:id/price                # Update pricing
DELETE /api/manager/rooms/:id                      # Delete room
GET    /api/manager/bookings                       # Hotel's bookings
GET    /api/manager/bookings/:id                   # Booking details
PUT    /api/manager/bookings/:id/status            # Update booking status
GET    /api/manager/analytics                      # Hotel analytics
```

### Developer (Protected)

```bash
GET    /api/developer/hotels                       # All hotels
POST   /api/developer/hotels                       # Create hotel
PUT    /api/developer/hotels/:id                   # Update hotel
DELETE /api/developer/hotels/:id                   # Delete hotel
GET    /api/developer/manager-requests             # Pending approvals
POST   /api/developer/manager-requests/:id/approve # Approve manager
POST   /api/developer/manager-requests/:id/reject  # Reject manager
GET    /api/developer/settings                     # Get all settings
PUT    /api/developer/settings/:key                # Update setting
GET    /api/developer/analytics/dashboard          # System dashboard
GET    /api/developer/analytics/payments           # Payment analytics
GET    /api/developer/audit-logs                   # Compliance logs
```

### Payment (Protected)

```bash
POST   /api/payment/razorpay/create-order          # Create Razorpay order
POST   /api/payment/razorpay/verify                # Verify payment
POST   /api/payment/razorpay/webhook               # Razorpay webhook
POST   /api/payment/stripe/create-intent           # Create Stripe intent
POST   /api/payment/stripe/webhook                 # Stripe webhook
GET    /api/payment/status/:booking_id             # Check payment status
```

**Full API documentation:** See [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

---

## 🔒 Security Features

✅ **Authentication**

- JWT token-based with 7-day expiry
- Refresh token rotation
- OTP verification for customers
- Password hashing with bcrypt

✅ **Authorization**

- Role-based access control (Developer, Manager, Customer)
- Control hierarchy enforcement (Dev > Manager > Customer)
- Resource-level access checks

✅ **Payment Security**

- HMAC signature verification for Razorpay
- Webhook signature validation for Stripe
- PCI-DSS compliant (no card details stored)
- Order integrity checks

✅ **Data Protection**

- Prepared statements prevent SQL injection
- Input validation on all endpoints
- CORS configuration for frontend
- Rate limiting on auth endpoints

✅ **Audit & Compliance**

- Complete audit trail in `audit_logs` table
- Booking status history tracking
- Webhook event logging
- Admin action logging

---

## 🚀 Deployment

### Environment Variables Required

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Database
DB_HOST=your-db-host
DB_USER=db-user
DB_PASSWORD=secure-password
DB_NAME=hotel_booking_system

# JWT (change these!)
JWT_SECRET=min_32_character_strong_secret_key_here
REFRESH_TOKEN_SECRET=another_min_32_character_secret_key

# Payment Gateways
RAZORPAY_KEY_ID=rzp_live_XXXXX
RAZORPAY_KEY_SECRET=XXXXX
STRIPE_SECRET_KEY=sk_live_XXXXX

# (Other optional settings)
```

### Deployment Platforms

#### Heroku

```bash
heroku create app-name
git push heroku main
```

#### AWS/DigitalOcean

- Use PM2 for process management
- Configure Nginx reverse proxy
- Enable SSL with Let's Encrypt
- Set up monitoring and logging

#### Docker

```bash
docker build -t hotel-booking .
docker run -p 3000:3000 --env-file .env hotel-booking
```

---

## 📖 Documentation

- **[Backend Setup Guide](backend/SETUP_GUIDE.md)** - Complete installation & configuration
- **[API Documentation](backend/API_DOCUMENTATION.md)** - All endpoints with examples
- **[Project Specification](PROJECT_SPEC.md)** - Detailed requirements & features
- **[Database Schema](database/schema.sql)** - Table structures and relationships

---

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Check MySQL credentials in .env
mysql -u {DB_USER} -p {DB_NAME} -e "SELECT 1;"
```

### Port Already In Use

```bash
# Windows: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port: PORT=3001 npm run dev
```

### JWT Token Invalid

- Ensure `JWT_SECRET` is set in `.env`
- Tokens expire after `JWT_EXPIRY` (default: 7 days)
- Use refresh token endpoint to get new token

### Payment Not Processing

- Verify Razorpay/Stripe test keys in `.env`
- Check webhook configuration in payment dashboard
- Ensure webhook secrets are correct

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📜 License

This project is licensed under the MIT License - see LICENSE.md for details.

---

## 📞 Support

- **Email:** [support@hotelbooking.com](mailto:support@hotelbooking.com)
- **Issues:** [GitHub Issues](https://github.com/yourrepo/issues)
- **Documentation:** [See Docs](backend/API_DOCUMENTATION.md)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Hotel ratings and reviews
- [ ] Wishlist/favorites feature
- [ ] Group bookings
- [ ] Multi-currency support
- [ ] Inventory management
- [ ] Channel manager integration
- [ ] Advanced analytics

---

## 👥 Team

- **Project:** Hotel Booking System
- **Version:** 1.0.0
- **Status:** Production Ready ✅

---

**Last Updated:** January 2024
**Next:** [Setup Backend](backend/SETUP_GUIDE.md)
