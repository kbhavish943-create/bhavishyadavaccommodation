# 🚀 WEEK 2: PAYMENT INTEGRATION GUIDE
**Status:** Ready to Implement  
**Date:** December 23, 2025  
**Completion Estimate:** 2-3 days  

---

## 📋 WHAT'S NEW (Week 2 Implementation)

### ✅ Created Files

| File | Purpose | Status |
|------|---------|--------|
| **paymentController.js** | All payment logic (Razorpay + Stripe) | ✅ READY |
| **paymentRoutes.js** | API endpoint definitions | ✅ READY |
| **app.js (updated)** | Payment routes mounted | ✅ READY |

### 🎯 5 New Endpoints

```
POST   /api/payments/razorpay/create-order     ← Create Razorpay order
POST   /api/payments/razorpay/webhook          ← Razorpay webhook handler
POST   /api/payments/stripe/create-intent      ← Create Stripe payment intent
POST   /api/payments/stripe/webhook            ← Stripe webhook handler
GET    /api/payments/:bookingId/status         ← Check payment status
```

---

## 🔐 SECURITY: ATOMIC TRANSACTION FLOW

### Problem We Solve

```
Without atomicity (DANGEROUS):
  Booking created → Payment successful → 
    [CRASH] → Availability NOT marked booked → DOUBLE BOOKING RISK ❌

With atomicity (SAFE):
  MongoDB transaction starts
    → Update Booking (status = confirmed)
    → Update Availability (status = booked, lockedUntil = null)
  Transaction commits (all-or-nothing) ✅
```

### Critical Integration Points

#### 1. **Razorpay: Create Order Flow**

```javascript
POST /api/payments/razorpay/create-order
  ↓
  Validate booking status = 'pending'
  ↓
  Verify availability.status = 'locked' && lockedUntil > now
  ↓
  Create Razorpay order (amount in paise)
  ↓
  Save orderId to booking.payment.orderId
  ↓
  Return {orderId, keyId, amount}
  ↓
Frontend → Razorpay modal opens
           User enters card details
           Razorpay processes payment
           ↓
           Razorpay → POST /api/payments/razorpay/webhook
```

#### 2. **Razorpay: Webhook Handler (CRITICAL)**

```javascript
POST /api/payments/razorpay/webhook (Razorpay → Backend)
  ↓
  ✅ Verify HMAC-SHA256 signature (MUST PASS)
  ↓
  IF payment.authorized OR payment.captured:
    ↓
    Start MongoDB transaction
      → Update Booking:
          - payment.status = 'completed'
          - booking.status = 'confirmed'
          - Save transactionId, paymentDate
      → Update Availability:
          - status = 'booked' (PERMANENT)
          - bookingId = booking._id
          - lockedUntil = null (remove TTL)
      → Log Payment document
    ↓
    Commit transaction (all-or-nothing)
    ↓
    Return 200 OK (acknowledge webhook)
  ↓
  ELSE IF payment.failed:
    → Update Booking: payment.status = 'failed'
    → Availability auto-unlocks after 15 min TTL
    → Booking expires, customer books again
```

#### 3. **Stripe: Similar Flow**

```javascript
POST /api/payments/stripe/create-intent
  ↓ (same validation as Razorpay)
  ↓
  Create Stripe payment intent
  ↓
  Return {clientSecret, paymentIntentId}
  ↓
Frontend → Stripe.js handles card
           ↓
           Stripe → POST /api/payments/stripe/webhook
```

---

## 🔧 ENVIRONMENT SETUP

### Add to `.env` file:

```bash
# Razorpay
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX
```

### Where to Get These Keys:

**Razorpay:**
1. Go to https://dashboard.razorpay.com/settings/api-keys
2. Copy Key ID + Key Secret
3. Settings → Webhooks → Create webhook
4. URL: `https://yourdomain.com/api/payments/razorpay/webhook`
5. Events: `payment.authorized`, `payment.captured`, `payment.failed`
6. Copy webhook secret

**Stripe:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy Publishable + Secret keys
3. Developers → Webhooks → Add endpoint
4. URL: `https://yourdomain.com/api/payments/stripe/webhook`
5. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
6. Copy signing secret

---

## 🧪 TESTING WEEK 2 PAYMENT FLOW

### Test Setup (Run These First)

```bash
# Terminal 1: Backend
cd backend-setup
npm run dev  # Should see ✓ MongoDB connected & ✓ Routes registered

# Terminal 2: Testing
cd backend-setup
```

### Test 1: Create Razorpay Order

```powershell
$bookingId = "INSERT_BOOKING_ID_HERE"  # From Week 1 test
$body = @{
    bookingId = $bookingId
    amount = 50000  # Match booking.pricing.totalAmount
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/payments/razorpay/create-order" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**Expected Response (Test Passes):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_1234567890",
    "keyId": "rzp_live_ABC",
    "amount": 50000,
    "currency": "INR"
  }
}
```

**Error Responses (Debug):**
- `404 Booking not found` → Check bookingId is correct
- `409 Booking payment status is confirmed` → Already paid
- `409 Availability lock expired` → Booking took >15 min, create new one
- `400 Amount mismatch` → Verify amount in request

### Test 2: Webhook Signature Verification

**Local Testing Without Razorpay:**

```powershell
# 1. Create a test payload
$payload = @{
    event = "payment.authorized"
    payload = @{
        payment = @{
            entity = @{
                id = "pay_test123"
                order_id = "order_test123"
                amount = 50000
                notes = @{
                    bookingId = "INSERT_BOOKING_ID"
                }
                error_reason = $null
            }
        }
    }
} | ConvertTo-Json

# 2. Generate valid signature
# HMAC-SHA256(payload, RAZORPAY_WEBHOOK_SECRET)
$secret = $env:RAZORPAY_WEBHOOK_SECRET
$signature = @"
using System;
using System.Security.Cryptography;
using System.Text;

public class SignatureGenerator {
    public static void Main(string[] args) {
        string payload = args[0];
        string secret = args[1];
        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret))) {
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            Console.WriteLine(BitConverter.ToString(hash).Replace("-", "").ToLower());
        }
    }
}
"@

# 3. Send webhook
Invoke-WebRequest -Uri "http://localhost:3000/api/payments/razorpay/webhook" `
  -Method POST `
  -Headers @{
      "Content-Type" = "application/json"
      "x-razorpay-signature" = "GENERATED_SIGNATURE_HERE"
  } `
  -Body $payload
```

### Test 3: Check Payment Status

```powershell
$bookingId = "INSERT_BOOKING_ID_HERE"

Invoke-WebRequest -Uri "http://localhost:3000/api/payments/$bookingId/status" `
  -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**Expected (Before Payment):**
```json
{
  "success": true,
  "data": {
    "bookingId": "...",
    "bookingStatus": "pending",
    "paymentStatus": "pending",
    "amount": 50000,
    "paidAmount": 0
  }
}
```

**Expected (After Payment):**
```json
{
  "success": true,
  "data": {
    "bookingStatus": "confirmed",
    "paymentStatus": "completed",
    "paidAmount": 50000,
    "transactionId": "pay_1234567890"
  }
}
```

---

## 📊 FLOW DIAGRAM: END-TO-END

```
┌─────────────────────────────────────────────────────────────────┐
│                      WEEK 2 PAYMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Customer Creates Booking (Week 1)
    ↓
    booking.status = 'pending'
    availability.status = 'locked' (TTL: 15 min)
    ↓
    ┌─────────────────────────────────────────┐
    │  PAYMENT SELECTION (Frontend)           │
    │  Choose: Razorpay OR Stripe             │
    └─────────────────────────────────────────┘
    ↓
    IF Razorpay:
      POST /api/payments/razorpay/create-order
        ↓
        ✅ Validate booking + availability lock
        ✅ Create Razorpay order
        ✅ Store orderId in booking
        ↓ Return {orderId, keyId}
      ↓
      Frontend opens Razorpay modal
        ↓
        User enters payment details
        ↓
        Razorpay processes & redirects to success/cancel
        ↓
        Razorpay → POST /api/payments/razorpay/webhook
          ↓
          ✅ Verify signature
          ✅ Start transaction
          ✅ Update booking → 'confirmed'
          ✅ Update availability → 'booked' (permanent)
          ✅ Commit
          ↓
          Return 200 OK
      ↓
      Frontend receives notification
      ↓
      ✅ PAYMENT COMPLETE
      ✅ BOOKING CONFIRMED
      ✅ DATE PERMANENTLY LOCKED

    IF Stripe:
      [Same flow, different gateway]
    
    ↓
    ┌─────────────────────────────────────────┐
    │  FAILURE SCENARIO (Payment Fails)       │
    └─────────────────────────────────────────┘
    
    Webhook receives payment.failed event
      ↓
      Update booking.payment.status = 'failed'
      ↓
      Availability.status remains 'locked'
      ↓
      After 15 min TTL expires:
        availability.status = 'unlocked'
        booking.status = 'expired'
      ↓
      Customer can create new booking (date available)
```

---

## 🛡️ CRITICAL SECURITY CHECKLIST

- [ ] **NEVER trust client amount** — Always validate against `booking.pricing.totalAmount`
- [ ] **ALWAYS verify webhook signatures** — Check HMAC before any DB write
- [ ] **USE MongoDB transactions** — Ensure booking + availability updates are atomic
- [ ] **STORE secrets in .env** — Never commit RAZORPAY_KEY_SECRET or STRIPE_SECRET_KEY
- [ ] **HTTPS ONLY in production** — Webhooks must use HTTPS
- [ ] **LOG all payment events** — For audit trail & debugging
- [ ] **IDEMPOTENCY** — If webhook received twice, don't double-update (TODO: implement)

---

## 🐛 DEBUGGING TIPS

### Problem: "Booking not found"
- Check bookingId is a valid MongoDB ObjectId
- Verify booking was created in Week 1 test

### Problem: "Availability lock expired"
- Booking lock is 15 minutes
- If you wait >15 min before paying, you must create new booking
- **Fix:** In testing, increase `LOCK_DURATION` in availabilityController.js

### Problem: "Webhook signature verification failed"
- Verify webhook secret matches in .env
- Check request body wasn't modified (raw body required)
- Test with Razorpay/Stripe test webhook tools

### Problem: "Amount mismatch"
- Ensure frontend sends exact amount from `booking.pricing.totalAmount`
- Amounts in Razorpay are in **paise** (₹1 = 100 paise)
- Amounts in Stripe are in **cents** (conversion happens in controller)

### Problem: "Booking status not confirmed after payment"
- Check MongoDB transactions are enabled (should be from Week 1)
- Run: `rs.initiate()` in MongoDB if transactions fail
- Check application logs for detailed error

---

## ✅ SUCCESS CRITERIA

After Week 2 implementation:

- [ ] `npm run dev` starts without errors
- [ ] POST /api/payments/razorpay/create-order returns 200 with orderId
- [ ] POST /api/payments/razorpay/webhook accepts test webhook
- [ ] Booking status changes to 'confirmed' after payment
- [ ] Availability status changes to 'booked' (permanent)
- [ ] Payment document is logged for audit
- [ ] GET /api/payments/:bookingId/status returns payment details

---

## 🎯 NEXT STEPS (Week 3)

Once Week 2 is complete:

1. **Frontend Integration**
   - Install `@razorpay/razorpay-js` + `@stripe/stripe-js`
   - Create payment selection UI
   - Implement Razorpay modal
   - Implement Stripe Elements

2. **Error Handling**
   - User-friendly error messages
   - Retry logic for failed payments
   - Refund workflow (optional)

3. **Monitoring**
   - Set up payment alerts
   - Create payment dashboard
   - Weekly reconciliation script

---

## 📞 REFERENCE

- **Razorpay Docs:** https://razorpay.com/docs/
- **Stripe Docs:** https://stripe.com/docs
- **Controller Code:** [paymentController.js](./src/controllers/paymentController.js)
- **Routes Code:** [paymentRoutes.js](./src/routes/paymentRoutes.js)
- **Week 1 Lock Logic:** [availabilityController.js](./src/controllers/availabilityController.js)

---

**Status: Week 2 Ready to Test** ✅  
**Next Update:** After first payment webhook test
