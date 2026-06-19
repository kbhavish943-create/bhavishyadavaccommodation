# 🎯 WEEK 1.5 → WEEK 2 TRANSITION MASTER GUIDE

**Status:** Week 1.5 Complete ✅ → Week 2 Ready ✅  
**Date:** December 23, 2025  
**Next Action:** Run Week 2 tests (30 min)

---

## 🏁 WHERE YOU ARE NOW

### Week 1.5 Achievement
```
✅ Availability locking implemented (atomic, TTL-based)
✅ Booking creation with date reservation
✅ 15-minute lock auto-unlock on payment failure
✅ MongoDB transactions preventing double-booking
✅ Test suite validates all scenarios
```

### Week 2 Ready
```
✅ Payment controller (Razorpay + Stripe) implemented
✅ 5 payment endpoints created & documented
✅ Webhook handlers with signature verification
✅ Availability → 'booked' (permanent) on payment success
✅ Booking → 'confirmed' on payment success
```

---

## 📊 WEEK 1.5 → 2 INTEGRATION MAP

```
Week 1.5 Availability Locking
└── hallId + date locked (15 min TTL)
└── MongoDB transaction: Booking + Availability
└── Status: 'pending' + 'locked'

    ↓ Payment Workflow Starts ↓

Week 2 Payment Integration
└── POST /create-order verifies lock is still active
└── Creates Razorpay/Stripe order
└── Stores orderId in booking
└── User pays in gateway modal

    ↓ Webhook Confirmation ↓

Payment Gateway
└── Webhook: POST /webhook
└── Verify signature (CRITICAL SECURITY)
└── Start transaction:
    ├── Booking: status = 'confirmed', payment.status = 'completed'
    ├── Availability: status = 'booked' (permanent), lockedUntil = null
    ├── Payment: log transaction
    └── Commit (all-or-nothing)

Result: ✅ Booking Confirmed ✅ Date Locked Forever
```

---

## 🚀 QUICK START (5 MINUTES)

### For Testing Week 2

**Terminal 1:**
```bash
cd backend-setup
npm run dev
```

**Terminal 2:**
```bash
# Follow WEEK2_QUICK_TEST.md
powershell
# Run any of the 3 test options
```

### For Understanding

**Read in order:**
1. `WEEK2_IMPLEMENTATION_CHECKLIST.md` (overview, 5 min)
2. `WEEK2_PAYMENT_INTEGRATION.md` (detailed guide, 15 min)
3. `paymentController.js` (code comments, 10 min)

---

## 🔐 CRITICAL INTEGRATION POINTS

### 1. Availability Lock Verification (Prevent Fraud)

**Location:** `paymentController.js` → `createRazorpayOrder()`

```javascript
// BEFORE creating order, verify lock is still active
const availability = await Availability.findOne({
  hallId: booking.hallId,
  date: { /* ... */ },
  status: 'locked',  // ← MUST be locked
  lockedUntil: { $gt: new Date() }  // ← MUST not be expired
});

if (!availability) {
  throw Error('Availability lock expired or not found');
}
```

**Why:** Prevents payment creation for dates that are no longer reserved.

### 2. Webhook Signature Verification (Prevent Spoofing)

**Location:** `paymentController.js` → `razorpayWebhook()`

```javascript
// BEFORE updating database, verify signature
const signature = req.headers['x-razorpay-signature'];
const hash = crypto.createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex');

if (hash !== signature) {
  throw Error('Webhook signature verification failed');
}
```

**Why:** Only legitimate Razorpay can update bookings (no spoofing).

### 3. Atomic Transaction (Prevent Partial Updates)

**Location:** Both create-order and webhook handlers

```javascript
const session = await mongoose.startSession();
session.startTransaction();

// Update booking
booking.payment.status = 'completed';
await booking.save({ session });

// Update availability (same transaction)
await Availability.findOneAndUpdate({...}, {status: 'booked'}, {session});

await session.commitTransaction();
```

**Why:** If server crashes mid-update, database stays consistent.

### 4. Amount Validation (Prevent Customer Tampering)

**Location:** `paymentController.js` → Both create-order methods

```javascript
if (Math.abs(amount - booking.pricing.totalAmount) > 1) {
  throw Error('Amount mismatch');
}
```

**Why:** Customer can't modify amount before sending to payment gateway.

---

## 📋 FILE STRUCTURE

```
backend-setup/
├── src/
│   ├── controllers/
│   │   ├── availabilityController.js  ← Week 1.5 (locking logic)
│   │   ├── bookingController.js       ← Week 1.5 (booking CRUD + transaction)
│   │   └── paymentController.js       ← Week 2 (payment + webhooks) ✅ NEW
│   ├── routes/
│   │   ├── availabilityRoutes.js      ← Week 1.5
│   │   ├── bookingRoutes.js           ← Week 1.5
│   │   └── paymentRoutes.js           ← Week 2 ✅ NEW
│   ├── models/
│   │   ├── Availability.js            ← Week 1.5
│   │   ├── Booking.js                 ← Week 1.5
│   │   └── Payment.js                 ← Week 2 (existing model)
│   └── app.js                         ← Updated ✅
├── WEEK2_PAYMENT_INTEGRATION.md       ← ✅ NEW (detailed guide)
├── WEEK2_QUICK_TEST.md                ← ✅ NEW (testing guide)
├── WEEK2_IMPLEMENTATION_CHECKLIST.md  ← ✅ NEW (validation)
└── .env                               ← Needs gateway keys
```

---

## 🧪 TESTING PROGRESSION

### Level 1: Endpoint Validation (5 min)

```powershell
# Test 1: Create order endpoint is callable
POST /api/payments/razorpay/create-order
  Input: {bookingId, amount}
  Expected: 200 OK with {orderId, keyId}
  Verifies: Endpoint works, booking validation works
```

### Level 2: Lock Verification (5 min)

```powershell
# Test 2: Lock must be active to create order
POST /api/payments/razorpay/create-order (with expired lock)
  Expected: 409 Conflict "Availability lock has expired"
  Verifies: Lock check prevents orders for expired bookings
```

### Level 3: Webhook Processing (10 min)

```powershell
# Test 3: Webhook with wrong signature rejected
POST /api/payments/razorpay/webhook (invalid signature)
  Expected: 401 Unauthorized "Webhook signature verification failed"
  Verifies: Signature verification works

# Test 4: Webhook with valid signature succeeds
POST /api/payments/razorpay/webhook (valid signature)
  Expected: 200 OK "Payment processed successfully"
  Verifies: Booking updated to 'confirmed', availability updated to 'booked'
```

### Level 4: Data Consistency (5 min)

```powershell
# Test 5: After webhook, verify both documents updated
GET /api/payments/:bookingId/status
  Expected: {paymentStatus: 'completed', bookingStatus: 'confirmed'}
  
GET /api/availability/{hallId}/{date}
  Expected: {status: 'booked', lockedUntil: null}
  
Verifies: Atomic transaction worked
```

---

## 🛠️ ENVIRONMENT SETUP

### Add to `.env`

```bash
# Razorpay (Get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXX  # KEEP SECRET!
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX

# Stripe (Get from https://dashboard.stripe.com)
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXX  # KEEP SECRET!
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX

# MongoDB (from Week 1.5)
MONGODB_URI=mongodb://localhost:27017/event-booking
```

### Test Credentials (For Development)

```bash
# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=test_secret_XXXXXXXXXXXXX

# Stripe Test Mode
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXX
```

---

## 🔄 FLOW DIAGRAM

```
┌────────────────────────────────────────────────────────────┐
│              COMPLETE BOOKING → PAYMENT FLOW               │
└────────────────────────────────────────────────────────────┘

WEEK 1.5: Create Booking & Lock Date
─────────────────────────────────────
Frontend User
  ├─ Select hall, date, guests
  ├─ POST /api/bookings/create
  └─ Booking created with status='pending'
  
Backend Atomically
  ├─ Insert Booking document
  ├─ Insert Availability document
  │  ├─ status: 'locked'
  │  ├─ lockedUntil: now + 15 minutes
  │  └─ index: (hallId, date) unique
  └─ Return booking ID

Frontend User Sees
  ├─ "Booking created!"
  ├─ "You have 15 minutes to pay"
  └─ "Redirecting to payment..."


WEEK 2: Payment Gateway Integration
────────────────────────────────────
Frontend User
  ├─ Sees payment selection (Razorpay or Stripe)
  ├─ Clicks "Pay Now"
  └─ POST /api/payments/razorpay/create-order

Backend
  ├─ VALIDATE: booking.status = 'pending'
  ├─ VERIFY: availability.status = 'locked' && lockedUntil > now
  ├─ CHECK: amount matches booking.pricing.totalAmount
  ├─ CREATE: Razorpay order (backend API)
  ├─ STORE: orderId in booking.payment.orderId
  └─ Return {orderId, keyId} to frontend

Frontend User
  ├─ Razorpay modal opens
  ├─ Enters card details
  ├─ Clicks "Pay"
  └─ Razorpay processes payment


Payment Gateway
  ├─ Payment successful
  ├─ Sends webhook: POST /api/payments/razorpay/webhook
  └─ Webhook includes: {event, payment}

Backend Webhook Handler
  ├─ VERIFY: HMAC-SHA256 signature (SECURITY)
  ├─ START: MongoDB transaction
  │  ├─ Find booking by payment notes
  │  ├─ Update booking:
  │  │  ├─ payment.status = 'completed'
  │  │  ├─ payment.transactionId = paymentId
  │  │  ├─ booking.status = 'confirmed'
  │  │  └─ payment.paymentDate = now
  │  ├─ Update availability:
  │  │  ├─ status = 'booked' (PERMANENT!)
  │  │  ├─ lockedUntil = null (no more TTL)
  │  │  └─ bookingId = booking._id
  │  └─ Log Payment document
  ├─ COMMIT: Transaction
  └─ Return 200 OK

Result
  ├─ ✅ Booking: 'confirmed'
  ├─ ✅ Payment: 'completed'
  ├─ ✅ Availability: 'booked' (locked forever)
  └─ ✅ Date protected from double-booking


Failure Scenario: Payment Fails
───────────────────────────────
Payment Gateway
  ├─ Payment failed
  ├─ Sends webhook: {event: 'payment.failed'}
  └─ Includes: failure reason

Backend
  ├─ Update booking: payment.status = 'failed'
  ├─ Leave availability.status = 'locked'
  ├─ lockedUntil still active (15 min)
  └─ Customer can retry payment

After 15 Minutes
  ├─ MongoDB TTL index triggers
  ├─ Availability auto-expires
  ├─ Booking auto-expires
  └─ Date available for new booking


Idempotency: Webhook Received Twice
────────────────────────────────────
First Webhook
  ├─ Booking updated to 'confirmed'
  └─ Availability updated to 'booked'

Second Webhook (duplicate)
  ├─ Booking already 'confirmed'
  ├─ Update idempotent (safe)
  └─ No double-charge

┌────────────────────────────────────────────────────────────┐
│              INTEGRATION COMPLETE ✅                       │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ SUCCESS CRITERIA

After Week 2 implementation, verify:

- [ ] `npm run dev` starts without errors
- [ ] `/health` endpoint returns 200
- [ ] All routes mounted (`/api/auth`, `/api/halls`, `/api/availability`, `/api/bookings`, `/api/payments`)
- [ ] POST /api/payments/razorpay/create-order returns 200 with orderId
- [ ] POST /api/payments/razorpay/webhook verifies signature
- [ ] Booking status changes to 'confirmed' after webhook
- [ ] Availability status changes to 'booked' after webhook
- [ ] lockedUntil removed from availability after webhook
- [ ] Payment document logged for audit trail

---

## 🎯 NEXT WEEK: WEEK 3 FRONTEND INTEGRATION

Once Week 2 backend is tested:

### Week 3.1: Payment Method Selection UI
- Install Razorpay & Stripe SDKs
- Create payment selection screen
- Store user's preferred method

### Week 3.2: Razorpay Integration
- Install `@razorpay/razorpay-js`
- Implement modal launcher
- Handle success/cancel redirects

### Week 3.3: Stripe Integration
- Install `@stripe/stripe-js` + `@stripe/react-stripe-js`
- Build payment form with Elements
- Handle payment intent confirmation

### Week 3.4: Confirmation & Email
- Success page with booking details
- Email confirmation to customer
- Send to vendor

---

## 📞 TROUBLESHOOTING REFERENCE

| Problem | Cause | Solution |
|---------|-------|----------|
| `404 Booking not found` | Wrong bookingId | Use ID from Week 1 test |
| `409 Availability lock expired` | >15 minutes elapsed | Create new booking |
| `400 Amount mismatch` | Wrong amount in request | Match `booking.pricing.totalAmount` |
| `401 Signature verification failed` | Wrong webhook secret | Verify in .env matches gateway |
| `500 Failed to create payment order` | Missing RAZORPAY keys | Add to .env from dashboard |
| `Booking status still 'pending'` | Webhook not processed | Check webhook URL is reachable |

---

## 📚 QUICK REFERENCE LINKS

| Document | Purpose | Time |
|----------|---------|------|
| [WEEK2_IMPLEMENTATION_CHECKLIST.md](./WEEK2_IMPLEMENTATION_CHECKLIST.md) | Overview + validation | 5 min |
| [WEEK2_PAYMENT_INTEGRATION.md](./WEEK2_PAYMENT_INTEGRATION.md) | Architecture + security | 15 min |
| [WEEK2_QUICK_TEST.md](./WEEK2_QUICK_TEST.md) | Testing procedures | 10 min |
| [paymentController.js](./src/controllers/paymentController.js) | Implementation code | 20 min |
| [paymentRoutes.js](./src/routes/paymentRoutes.js) | Endpoint definitions | 5 min |

---

## 🏆 DELIVERY STATUS

```
Week 1.5: Availability Locking
  ✅ availabilityController.js
  ✅ bookingController.js
  ✅ availabilityRoutes.js
  ✅ bookingRoutes.js
  ✅ MongoDB transactions
  ✅ TTL-based auto-unlock
  ✅ Test suite

Week 2: Payment Integration
  ✅ paymentController.js (436 lines)
  ✅ paymentRoutes.js (126 lines)
  ✅ app.js (updated)
  ✅ WEEK2_PAYMENT_INTEGRATION.md
  ✅ WEEK2_QUICK_TEST.md
  ✅ WEEK2_IMPLEMENTATION_CHECKLIST.md
  
INTEGRATION: COMPLETE ✅
```

---

**Status: Ready for Week 2 Testing** 🚀  
**Estimated Testing Time:** 30 minutes  
**Next Action:** Run WEEK2_QUICK_TEST.md
