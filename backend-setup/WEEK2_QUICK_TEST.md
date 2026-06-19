# Quick Test: Week 2 Payment Integration

## 🚀 SETUP (2 MINUTES)

### Terminal 1: Start Backend

```powershell
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
npm run dev
```

Expected Output:
```
✓ MongoDB connected to mongodb://localhost:27017/event-booking
✓ Routes registered: /api/auth, /api/halls, /api/availability, /api/bookings, /api/payments
✅ Server running on port 3000
```

---

## 🧪 QUICK TESTS (Pick One)

### Option A: Create Order Only (Fast)

```powershell
# Terminal 2: Testing

# STEP 1: Get a booking ID from Week 1 test (or create one manually)
# For now, use placeholder: Replace with real ID when available

$bookingId = "REPLACE_WITH_REAL_BOOKING_ID"
$amount = 50000  # Match booking.pricing.totalAmount

# STEP 2: Create Razorpay order
$body = @{
    bookingId = $bookingId
    amount = $amount
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/razorpay/create-order" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

Write-Host "✅ Test passed!" -ForegroundColor Green
Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_XXXXXXXXXX",
    "keyId": "rzp_live_XXXXX",
    "amount": 50000,
    "currency": "INR"
  }
}
```

---

### Option B: Full Payment Flow (With Mock Webhook)

**STEP 1:** Create order (same as above)

**STEP 2:** Simulate Razorpay webhook

```powershell
# Simulate successful payment webhook

$webhookPayload = @{
    event = "payment.authorized"
    payload = @{
        payment = @{
            entity = @{
                id = "pay_12345678"
                order_id = "order_FROM_STEP1"
                amount = 50000
                notes = @{
                    bookingId = $bookingId
                }
            }
        }
    }
} | ConvertTo-Json

# Send webhook
$webhookResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/razorpay/webhook" `
  -Method POST `
  -Headers @{
      "Content-Type" = "application/json"
      "x-razorpay-signature" = "test_signature_verify_later"
  } `
  -Body $webhookPayload

Write-Host "Webhook Response:"
Write-Host ($webhookResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "bookingId": "...",
  "paymentId": "pay_12345678"
}
```

---

### Option C: Check Payment Status

```powershell
$bookingId = "REPLACE_WITH_REAL_BOOKING_ID"

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/$bookingId/status" `
  -Method GET

Write-Host "Payment Status:"
Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
```

---

## 📋 VALIDATION CHECKLIST

After running tests, verify:

- [ ] Create order returns 200 with orderId
- [ ] orderId is stored in booking.payment.orderId
- [ ] Webhook processes without signature error
- [ ] Booking status changes to 'confirmed'
- [ ] Availability status changes to 'booked'
- [ ] Payment status returns 'completed'

---

## 🐛 TROUBLESHOOTING

| Error | Solution |
|-------|----------|
| `404 Booking not found` | Use real bookingId from Week 1 test |
| `409 Availability lock expired` | Create new booking (lock is 15 min) |
| `400 Amount mismatch` | Match amount to booking.pricing.totalAmount |
| `Signature verification failed` | webhook secret in .env might be wrong |
| `500 Failed to create payment order` | Check RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env |

---

## ✅ SUCCESS

If all tests return `"success": true`, you're ready for Week 3 frontend integration!

**Time to complete:** 5-10 minutes
