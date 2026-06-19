# 🚀 Multi-Service Platform - Quick Start Guide

## 📦 What You Have Now

You've received **comprehensive documentation** for transforming your hotel booking website into a **modern multi-service marketplace** that supports:

✅ **Hotels** - Room bookings  
✅ **Marriage Halls** - Wedding venues  
✅ **Birthday Venues** - Party spaces  
✅ **Party Halls** - Event spaces  
✅ **Event Services** - Catering, DJ, Photography, Decoration  

---

## 📚 Documentation Files Created

| File | Purpose |
|------|---------|
| `MULTI_SERVICE_PLATFORM_UPGRADE.md` | Complete platform overview, features, tech stack |
| `MULTI_SERVICE_MIGRATION.sql` | Database schema for all new tables |
| `BACKEND_IMPLEMENTATION_GUIDE.md` | API structure, controllers, business logic |
| `FRONTEND_IMPLEMENTATION_GUIDE.md` | UI components, pages, design system |
| `MULTI_SERVICE_QUICK_START.md` | THIS FILE - Step-by-step implementation |

---

## 🎯 Implementation Phases

### Phase 1: Database Setup (Day 1)

#### Step 1.1: Create New Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE event_booking_platform;
USE event_booking_platform;
```

#### Step 1.2: Run Migration SQL

```bash
# Run the migration script
mysql -u root -p event_booking_platform < MULTI_SERVICE_MIGRATION.sql

# Verify tables created
mysql -u root -p event_booking_platform -e "SHOW TABLES;"
```

#### Step 1.3: Verify Schema

```bash
# Should show tables like:
# - service_categories
# - vendors
# - vendor_services
# - availability_slots
# - bookings
# - payments
# - reviews
# etc.
```

### Phase 2: Backend Setup (Days 2-4)

#### Step 2.1: Install Dependencies

```bash
cd server
npm install
npm install razorpay stripe axios bull redis
```

#### Step 2.2: Update Environment Variables

```bash
# Copy .env.example to .env
cp .env.example .env

# Add these new variables
DB_NAME=event_booking_platform
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password

# Payment Gateways
RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
STRIPE_PUBLIC_KEY=YOUR_STRIPE_PUBLIC
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET

# Platform Settings
PLATFORM_COMMISSION_PERCENTAGE=10
PAYMENT_GATEWAY_FEE=2.5
JWT_SECRET=your_super_secret_key

# File Storage
AWS_S3_BUCKET=your_bucket_name
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key

# Email
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS
TWILIO_ACCOUNT_SID=your_twilio_account
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=your_twilio_phone
```

#### Step 2.3: Create New API Routes

Start with these core routes:

**1. Service Discovery Routes** (`server/routes/services.js`)
```javascript
const express = require('express');
const router = express.Router();
const { 
  getServices, 
  getServiceById, 
  searchServices 
} = require('../controllers/serviceController');

// Public routes
router.get('/services', getServices);           // GET /api/services?category=hotels&city=Mumbai
router.get('/services/:id', getServiceById);   // GET /api/services/123
router.get('/search', searchServices);          // GET /api/search?q=marriage&location=Delhi

module.exports = router;
```

**2. Vendor Routes** (`server/routes/vendors.js`)
```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getVendorProfile,
  updateVendorProfile,
  getVendorDashboard,
  createService,
  updateService,
  deleteService
} = require('../controllers/vendorController');

// Vendor only routes
router.get('/vendor/profile', authenticateToken, getVendorProfile);
router.put('/vendor/profile', authenticateToken, updateVendorProfile);
router.get('/vendor/dashboard', authenticateToken, getVendorDashboard);
router.post('/vendor/services', authenticateToken, createService);
router.put('/vendor/services/:id', authenticateToken, updateService);
router.delete('/vendor/services/:id', authenticateToken, deleteService);

module.exports = router;
```

**3. Booking Routes** (`server/routes/bookings.js`)
```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
  rescheduleBooking
} = require('../controllers/bookingController');

// Protected routes
router.post('/bookings', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);
router.get('/bookings/:id', authenticateToken, getBookingDetails);
router.post('/bookings/:id/cancel', authenticateToken, cancelBooking);
router.post('/bookings/:id/reschedule', authenticateToken, rescheduleBooking);

module.exports = router;
```

#### Step 2.4: Update Main Server File

```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/services'));
app.use('/api', require('./routes/bookings'));
app.use('/api', require('./routes/payments'));
app.use('/api', require('./routes/vendors'));
app.use('/api', require('./routes/reviews'));
app.use('/api', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

### Phase 3: Frontend Setup (Days 5-7)

#### Step 3.1: Update Next.js Pages

Update `frontend/pages/index.tsx`:

```tsx
import React from 'react';
import CategoryCarousel from '@/components/discovery/CategoryCarousel';
import FeaturedServices from '@/components/discovery/FeaturedServices';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Book Your Perfect Event Venue
          </h1>
          <p className="text-xl mb-8">
            Hotels • Marriage Halls • Birthday Venues • Party Halls & More
          </p>
        </div>
      </section>

      {/* Service Categories */}
      <CategoryCarousel />

      {/* Featured Services */}
      <FeaturedServices />
    </div>
  );
}
```

Create `frontend/pages/search.tsx`:

```tsx
import React, { useState } from 'react';
import ServiceFilters from '@/components/discovery/ServiceFilters';
import ServiceGrid from '@/components/discovery/ServiceGrid';
import { useSearch } from '@/hooks/useSearch';

export default function SearchPage() {
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    minPrice: 0,
    maxPrice: 100000,
    sortBy: 'popularity'
  });

  const { services } = useSearch(filters);

  return (
    <div className="flex gap-8 p-8 max-w-7xl mx-auto">
      <aside className="w-64">
        <ServiceFilters filters={filters} onChange={setFilters} />
      </aside>
      <main className="flex-1">
        {services && <ServiceGrid services={services} />}
      </main>
    </div>
  );
}
```

#### Step 3.2: Create Key Components

**ServiceCard.tsx**
```tsx
import React from 'react';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';

export default function ServiceCard({ service }) {
  return (
    <Link href={`/services/${service.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl">
        <img 
          src={service.images[0]} 
          alt={service.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold">{service.title}</h3>
          
          <div className="flex items-center gap-1 my-2">
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
            <span>{service.rating} ({service.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-gray-600 mb-3">
            <MapPin size={16} />
            <span className="text-sm">{service.city}</span>
          </div>

          <div className="text-2xl font-bold text-blue-600">
            ₹{service.basePrice.toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

#### Step 3.3: Create Custom Hooks

**hooks/useSearch.ts**
```typescript
import { useState, useEffect } from 'react';

export function useSearch(filters) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/services?${params}`);
        const data = await res.json();
        setServices(data.services);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [filters]);

  return { services, loading };
}
```

### Phase 4: Payment Integration (Day 8)

#### Step 4.1: Setup Razorpay

```javascript
// server/services/paymentService.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
async function createOrder(amount, bookingId) {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: `booking_${bookingId}`,
    notes: { bookingId }
  });
  return order;
}

// Verify payment
function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === razorpaySignature;
}

module.exports = { createOrder, verifyPayment };
```

#### Step 4.2: Create Payment API Route

```javascript
// server/routes/payments.js
const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../services/paymentService');
const { authenticateToken } = require('../middleware/auth');

// Create payment order
router.post('/payments/create-order', authenticateToken, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const order = await createOrder(amount, bookingId);
    
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment
router.post('/payments/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingId 
    } = req.body;
    
    if (verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      // Update booking status
      // Store payment record
      res.json({ success: true, message: 'Payment verified' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🧪 Testing the Platform

### 1. Test Service Creation

```bash
curl -X POST http://localhost:3000/api/vendor/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceType": "Deluxe Room",
    "title": "Luxury Suite with AC",
    "description": "Beautiful room with city view",
    "basePrice": 5000,
    "capacity": 2,
    "amenities": ["AC", "WiFi", "Breakfast"]
  }'
```

### 2. Test Service Search

```bash
curl "http://localhost:3000/api/services?category=hotels&city=Mumbai&minPrice=1000&maxPrice=10000"
```

### 3. Test Booking Creation

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceId": 1,
    "bookingDate": "2024-02-15",
    "guestCount": 2,
    "specialRequests": "Extra pillows please"
  }'
```

---

## 📊 Database Verification

```sql
-- Check service categories
SELECT * FROM service_categories;

-- Check vendors
SELECT * FROM vendors;

-- Check vendor services
SELECT * FROM vendor_services;

-- Check bookings
SELECT * FROM bookings;

-- Check payments
SELECT * FROM payments;
```

---

## 🔐 Security Checklist

- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] API keys (Razorpay, Stripe) stored securely
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] JWT tokens implemented
- [ ] Password hashing (bcrypt) used
- [ ] HTTPS enabled in production
- [ ] SQL injection prevention (parameterized queries)

---

## 📈 Next Steps After Setup

1. **Add Email Notifications**
   - Booking confirmations
   - Payment receipts
   - Reminders

2. **Add SMS Notifications**
   - OTP for customer login
   - Booking reminders
   - Status updates

3. **Implement Admin Dashboard**
   - Vendor management
   - Booking oversight
   - Analytics

4. **Add Vendor Analytics**
   - Revenue tracking
   - Booking trends
   - Customer feedback

5. **Implement Review System**
   - Customer reviews
   - Vendor responses
   - Rating calculations

6. **Payment Settlements**
   - Automatic payouts
   - Commission calculation
   - Tax management

---

## 🆘 Troubleshooting

### Issue: Database connection error
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Check credentials in .env
cat server/.env
```

### Issue: API not working
```bash
# Check server is running
curl http://localhost:3000/health

# Check logs
tail -f server.log
```

### Issue: Payment gateway error
```bash
# Verify API keys in .env
echo $RAZORPAY_KEY_ID

# Test payment with Razorpay test keys
# Use card: 4111 1111 1111 1111
```

---

## 📞 Support

For questions, refer to:
- `MULTI_SERVICE_PLATFORM_UPGRADE.md` - Overview & features
- `BACKEND_IMPLEMENTATION_GUIDE.md` - API details
- `FRONTEND_IMPLEMENTATION_GUIDE.md` - UI components
- Official docs: 
  - Razorpay: https://razorpay.com/docs
  - Stripe: https://stripe.com/docs
  - Next.js: https://nextjs.org/docs

---

## ✅ Completion Checklist

- [ ] Database schema created
- [ ] Environment variables configured
- [ ] Backend API routes implemented
- [ ] Frontend pages and components created
- [ ] Payment integration tested
- [ ] User authentication working
- [ ] Vendor dashboard functional
- [ ] Admin dashboard functional
- [ ] Email notifications sending
- [ ] Review system working
- [ ] Search and filters working
- [ ] Availability calendar functional
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Ready for production deployment

---

**You're all set! Start with Phase 1 and build incrementally. Good luck! 🚀**
