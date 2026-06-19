# ✅ WEEK 2 IMPLEMENTATION CHECKLIST

**Status:** All Components Ready  
**Date:** December 23, 2025  
**Completion Time Estimate:** 30 minutes (validation only)

---

## 📦 COMPONENTS DELIVERED

### Controllers ✅

- [x] **paymentController.js** (436 lines)
  - [x] `createRazorpayOrder()` — Create order + verify lock
  - [x] `razorpayWebhook()` — Process payment, mark booked
  - [x] `createStripePaymentIntent()` — Create intent + verify lock
  - [x] `stripeWebhook()` — Process Stripe events
  - [x] `getPaymentStatus()` — Fetch payment details
  - **Key Features:**
    - ✅ MongoDB transactions for atomicity
    - ✅ Availability lock validation (critical!)
    - ✅ Amount verification (prevents fraud)
    - ✅ Webhook signature verification (security)
    - ✅ TTL-based lock auto-unlock on failure

### Routes ✅

- [x] **paymentRoutes.js** (126 lines)
  - [x] `POST /api/payments/razorpay/create-order`
  - [x] `POST /api/payments/razorpay/webhook`
  - [x] `POST /api/payments/stripe/create-intent`
  - [x] `POST /api/payments/stripe/webhook`
  - [x] `GET /api/payments/:bookingId/status`
  - **Documentation:** Detailed comments for each endpoint

### Configuration ✅

- [x] **app.js (updated)**
  - [x] Payment routes mounted
  - [x] Commented TODOs removed for payment routes

### Documentation ✅

- [x] **WEEK2_PAYMENT_INTEGRATION.md** (300+ lines)
  - ✅ Complete architecture explanation
  - ✅ Security model (atomic transactions)
  - ✅ Setup instructions (.env keys)
  - ✅ Testing procedures
  - ✅ Flow diagrams
  - ✅ Debugging tips

- [x] **WEEK2_QUICK_TEST.md** (120 lines)
  - ✅ 2-minute setup
  - ✅ 3 test options (fast/full/status)
  - ✅ Expected outputs
  - ✅ Troubleshooting guide

---

## 🔐 SECURITY FEATURES IMPLEMENTED

### ✅ Atomicity (Booking + Availability)

```javascript
// All transactions use:
const session = await mongoose.startSession();
session.startTransaction();
// ... update both documents ...
await session.commitTransaction();
```

**Impact:** If payment webhook crashes mid-update, database stays consistent.

### ✅ Webhook Signature Verification

```javascript
// Razorpay: HMAC-SHA256
const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
if (hash !== signature) throw Error('Invalid signature');

// Stripe: Pre-built verification
stripe.webhooks.constructEvent(body, sig, secret);
```

**Impact:** Only legitimate payment gateways can update bookings.

### ✅ Amount Validation

```javascript
if (Math.abs(amount - booking.pricing.totalAmount) > 1) {
  throw Error('Amount mismatch');
}
```

**Impact:** Prevents customer tampering with payment amount.

### ✅ Availability Lock Protection

```javascript
// Before creating order, verify:
if (availability.status !== 'locked') throw Error('Lock not active');
if (availability.lockedUntil < new Date()) throw Error('Lock expired');
```

**Impact:** Prevents payment creation for expired bookings.

---

## 🏗️ ARCHITECTURE DECISIONS

### 1. **Two-Phase Payment Workflow**

```
Phase 1: Create Order (Frontend Initiated)
  POST /create-order → Verify lock active → Create gateway order → Return orderId
  
Phase 2: Webhook Confirmation (Gateway Initiated)
  Gateway → POST /webhook → Verify signature → Update booking & availability
```

**Why:** Separates validation (Phase 1) from confirmation (Phase 2).

### 2. **MongoDB Transactions**

```javascript
// All payment updates use atomic transactions:
session.startTransaction()
  booking.payment.status = 'completed'
  availability.status = 'booked'
session.commitTransaction()
```

**Why:** Ensures both documents update together. No partial updates.

### 3. **TTL-Based Auto-Unlock**

```javascript
// On payment failure:
availability.status = 'locked'
availability.lockedUntil = new Date() + 15 minutes
// After 15 min, availability auto-expires via MongoDB TTL index
```

**Why:** Customers don't lose their booking slot if payment fails.

### 4. **Idempotency Consideration**

**Current:** Simple (if webhook called twice, both updates are safe due to transactions)

**TODO for production:** Add `payment.idempotencyKey` + unique constraint

---

## 📊 DATA FLOW VERIFICATION

### Create Order Flow

```
frontend: POST /create-order {bookingId, amount}
  ↓
paymentController.createRazorpayOrder()
  ↓ Step 1: Validate input
  ↓ Step 2: Fetch booking, verify status = 'pending'
  ↓ Step 3: Check availability.status = 'locked' && lockedUntil > now (CRITICAL!)
  ↓ Step 4: Validate amount matches booking.pricing.totalAmount
  ↓ Step 5: Create Razorpay order (backend to Razorpay API)
  ↓ Step 6: Save orderId to booking.payment.orderId (transaction)
  ↓ Step 7: Log Payment document
  ↓
Response: {success: true, data: {orderId, keyId, amount}}
  ↓
frontend: Opens Razorpay modal with orderId
```

✅ **Verified:** All 7 steps in code

### Webhook Flow

```
Razorpay: payment.authorized event
  ↓
webhook: POST /api/payments/razorpay/webhook
  ↓ Step 1: Verify HMAC-SHA256 signature (SECURITY!)
  ↓ Step 2: Extract bookingId from payment.notes
  ↓ Step 3: Fetch booking, verify it exists
  ↓ Step 4: Verify amount matches booking
  ↓ Step 5: Start MongoDB transaction
       → Update booking: status='confirmed', payment.status='completed'
       → Update availability: status='booked', lockedUntil=null
       → Log Payment: status='completed'
  ↓ Step 6: Commit transaction
  ↓
Response: {success: true, message: 'Payment processed successfully'}
  ↓
Razorpay: Receives 200 OK (stops retry)
  ↓
Result: ✅ Booking confirmed ✅ Date permanently locked
```

✅ **Verified:** All 6 steps in code

---

## 🧪 TESTING STRATEGY

### Unit Tests Needed (TODO)

- [ ] `createRazorpayOrder()` — valid booking
- [ ] `createRazorpayOrder()` — expired lock
- [ ] `createRazorpayOrder()` — amount mismatch
- [ ] `razorpayWebhook()` — invalid signature
- [ ] `razorpayWebhook()` — success (booking confirmed)
- [ ] `razorpayWebhook()` — failure (lock preserved)

### Integration Tests (Manual, Below)

- [ ] Full create-order → webhook flow
- [ ] Signature verification
- [ ] MongoDB transaction rollback on error
- [ ] Lock expiry (15 min)

---

## 🚀 MANUAL TESTING STEPS

### Prerequisite

```bash
# 1. Ensure .env has:
RAZORPAY_KEY_ID=test_key
RAZORPAY_KEY_SECRET=test_secret
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test 1: Create Razorpay Order (5 min)

```powershell
# Terminal 1: Backend
npm run dev  # ✅ Should show "routes registered"

# Terminal 2: Testing
# Step A: Create booking first (Week 1)
# Step B: Call create-order endpoint
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/razorpay/create-order" `
  -Method POST `
  -Body (@{bookingId="..."; amount=50000} | ConvertTo-Json)

# Verify response
if ($response.StatusCode -eq 200) {
  Write-Host "✅ Test 1 PASSED: Create order works"
  $data = $response.Content | ConvertFrom-Json
  Write-Host "orderId: $($data.data.orderId)"
} else {
  Write-Host "❌ Test 1 FAILED: Status $($response.StatusCode)"
}
```

**Expected:** 200 OK with orderId

### Test 2: Check Lock Is Active (5 min)

```powershell
# Before calling create-order, verify availability lock exists

$hallId = "..."
$eventDate = "2025-12-25"

# Via MongoDB:
# db.availabilities.findOne({hallId: ObjectId("..."), date: new Date("2025-12-25")})

# Expected:
# {
#   status: "locked",
#   lockedUntil: <date 15 min from now>,
#   ...
# }
```

**Expected:** `status = 'locked'`, `lockedUntil` is in future

### Test 3: Webhook Signature Verification (5 min)

```powershell
# WRONG signature → 401
$wrongResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/razorpay/webhook" `
  -Method POST `
  -Headers @{"x-razorpay-signature"="wrong_signature"} `
  -Body $payload

if ($wrongResponse.StatusCode -eq 401) {
  Write-Host "✅ Test 3 PASSED: Signature verification works"
} else {
  Write-Host "❌ Test 3 FAILED: Should reject invalid signature"
}
```

**Expected:** 401 Unauthorized

### Test 4: Payment Status (5 min)

```powershell
# Before payment
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/$bookingId/status" -Method GET
$status = $response.Content | ConvertFrom-Json

if ($status.data.paymentStatus -eq "pending") {
  Write-Host "✅ Before payment: status = pending"
}

# After webhook
# (run webhook test above)
# Check again:
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/$bookingId/status" -Method GET
$status = $response.Content | ConvertFrom-Json

if ($status.data.paymentStatus -eq "completed") {
  Write-Host "✅ After payment: status = completed"
  Write-Host "✅ Booking status: $($status.data.bookingStatus)"
}
```

**Expected:** `pending` → `completed` after webhook

---

## ✅ VALIDATION CHECKLIST

Before moving to Week 3, verify:

- [ ] Files created:
  - [ ] `paymentController.js` (436 lines)
  - [ ] `paymentRoutes.js` (126 lines)
  - [ ] `app.js` (updated)

- [ ] Endpoints functional:
  - [ ] POST /api/payments/razorpay/create-order → 200 OK
  - [ ] POST /api/payments/razorpay/webhook → signature verified
  - [ ] POST /api/payments/stripe/create-intent → 200 OK
  - [ ] GET /api/payments/:bookingId/status → returns status

- [ ] Security verified:
  - [ ] Webhook signature verification works
  - [ ] Amount validation prevents tampering
  - [ ] Availability lock is checked
  - [ ] MongoDB transactions ensure atomicity

- [ ] Data consistency:
  - [ ] Booking updates atomically with availability
  - [ ] Payment logged in Payment collection
  - [ ] lockedUntil removed after booking

- [ ] Error handling:
  - [ ] 404 for missing booking
  - [ ] 409 for expired lock
  - [ ] 400 for amount mismatch
  - [ ] 401 for invalid webhook signature

---

## 🎯 READY FOR WEEK 3

Once all tests pass ✅:

### Week 3 Tasks:

1. **Frontend Payment Selection**
   - Install `@razorpay/razorpay-js` + `@stripe/stripe-js`
   - Create payment method selector
   - Build Razorpay modal launcher
   - Build Stripe Elements form

2. **Payment Success Page**
   - Redirect after successful payment
   - Display booking confirmation
   - Send email confirmation

3. **Error Handling**
   - Retry failed payments
   - Refund workflow
   - Payment dispute resolution

4. **Monitoring**
   - Payment analytics dashboard
   - Webhook failure alerts
   - Weekly reconciliation

---

## 📞 QUICK REFERENCE

| Component | Lines | Status | Purpose |
|-----------|-------|--------|---------|
| paymentController.js | 436 | ✅ | All payment logic |
| paymentRoutes.js | 126 | ✅ | Endpoint definitions |
| app.js | Updated | ✅ | Routes mounted |
| WEEK2_PAYMENT_INTEGRATION.md | 300+ | ✅ | Architecture guide |
| WEEK2_QUICK_TEST.md | 120 | ✅ | Testing guide |

---

**Delivery Status: COMPLETE** ✅  
**Next: Manual testing (30 min) → Week 3 Frontend Integration**
