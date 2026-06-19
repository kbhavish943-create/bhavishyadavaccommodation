# 💳 Razorpay Integration Guide

Complete setup guide for integrating Razorpay payment gateway with your application.

---

## 📋 Overview

This project now supports **Razorpay** payment processing for:
- ✅ Payment order creation
- ✅ Payment verification
- ✅ Webhook handling for payment events
- ✅ Full signature verification for security

---

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```powershell
cd server
npm install
```

This installs:
- `razorpay` - Official Razorpay SDK
- `body-parser` - JSON parsing middleware
- `crypto` - For signature verification (built-in)

**Frontend:**
```powershell
cd frontend
npm install
```

### 2. Create Razorpay Account

1. Go to https://razorpay.com
2. Sign up for free (test mode available)
3. Complete verification

### 3. Get API Credentials

**Test Mode Credentials:**
1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Copy **Key ID** (Test) - starts with `rzp_test_`
4. Copy **Key Secret** (Test) - keep this secret!

**Webhook Secret:**
1. Go to **Settings** → **Webhooks**
2. Create new webhook with URL: `https://yourdomain.com/api/razorpay/webhook`
3. Copy **Signing Secret** - starts with `whsec_`

### 4. Configure Environment Variables

**Backend (.env):**
```env
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Razorpay
RAZOR_KEY_ID=rzp_test_your_key_id_here
RAZOR_KEY_SECRET=your_razorpay_key_secret_here
RAZOR_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_RAZOR_KEY_ID=rzp_test_your_key_id_here
```

### 5. Run Locally

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

Open http://localhost:3001/payment

---

## 🔌 API Endpoints

### 1. Create Order

**Endpoint:** `POST /api/razorpay/create-order`

**Request:**
```json
{
  "amount": 15000,          // in paise (₹150)
  "currency": "INR",        // optional, defaults to INR
  "receipt": "rcpt_123"     // optional receipt ID
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "order_1234567890",
  "amount": 15000,
  "currency": "INR"
}
```

### 2. Verify Payment

**Endpoint:** `POST /api/razorpay/verify-payment`

**Request:**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_hash"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

**Response (Failure):**
```json
{
  "error": "Invalid signature"
}
```

### 3. Webhook Handler

**Endpoint:** `POST /api/razorpay/webhook`

**Headers Required:**
```
x-razorpay-signature: <signature>
Content-Type: application/json
```

**Event Types:**
- `payment.authorized` - Payment authorized
- `payment.captured` - Payment captured
- `payment.failed` - Payment failed
- `order.paid` - Order marked as paid

---

## 💻 Frontend Integration

### Payment Component

The payment page is at: `frontend/pages/payment.tsx`

**Features:**
- ✅ Amount input with INR currency
- ✅ Razorpay Checkout modal
- ✅ Payment verification
- ✅ Success/error messages
- ✅ Test card information display

### How It Works

1. **User enters amount** (in rupees)
2. **Frontend calls** `/api/razorpay/create-order`
3. **Backend creates order** and returns order_id
4. **Razorpay SDK opens** payment modal
5. **User enters payment details**
6. **Frontend verifies** payment signature
7. **Backend confirms** payment and updates database

### Test Payment

Use these test cards:

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| Success | 4111 1111 1111 1111 | Any future | Any 3 digits |
| Decline | 4111 1111 1111 1112 | Any future | Any 3 digits |
| 3D Secure | 4111 1111 1111 1111 | Any future | 000 |

---

## 🔐 Security Features

### 1. Signature Verification

All requests are verified using HMAC-SHA256:

```javascript
const secret = process.env.RAZOR_KEY_SECRET;
const body = razorpay_order_id + '|' + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');
```

### 2. Webhook Verification

Webhook signatures are verified before processing:

```javascript
const signature = req.headers['x-razorpay-signature'];
const body = JSON.stringify(req.body);
const expected = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');
```

### 3. Environment Variables

All secrets stored in `.env`:
- ✅ Never committed to Git
- ✅ Not exposed to frontend (except public key)
- ✅ Verified on every request

---

## 📊 Amount Conversions

**Important:** Razorpay uses **paise** for INR amounts

| Amount | Paise | Code |
|--------|-------|------|
| ₹1 | 100 | `100` |
| ₹10 | 1000 | `1000` |
| ₹100 | 10000 | `10000` |
| ₹150 | 15000 | `15000` |
| ₹1000 | 100000 | `100000` |

**Conversion formula:**
```
paise = amount_in_rupees * 100
rupees = paise / 100
```

---

## 🧪 Testing Locally

### 1. Start Servers

```powershell
# Terminal 1
cd server
npm run dev

# Terminal 2
cd frontend
npm run dev
```

### 2. Test Payment Flow

1. Open http://localhost:3001/payment
2. Enter amount: ₹150
3. Click "Pay ₹150"
4. Use test card: 4111 1111 1111 1111
5. Fill any expiry and CVV
6. Complete payment
7. See "✓ Payment successful!" message

### 3. Test Webhook (Optional)

Install Razorpay CLI:
```powershell
npm install -g razorpay-cli
```

Listen for webhooks:
```powershell
razorpay-cli listen --forward-to http://localhost:3000/api/razorpay/webhook
```

---

## 🚀 Deployment

### Environment Variables

**Vercel (Frontend):**
```
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
NEXT_PUBLIC_RAZOR_KEY_ID=rzp_test_... (or rzp_live_...)
```

**AWS/Backend:**
```
PORT=3000
CORS_ORIGIN=https://yourdomain.com
RAZOR_KEY_ID=rzp_live_your_production_key
RAZOR_KEY_SECRET=your_production_secret
RAZOR_WEBHOOK_SECRET=whsec_your_production_webhook
```

### Switch to Live Mode

1. In Razorpay Dashboard, toggle "Production Mode"
2. Get live credentials (starts with `rzp_live_`)
3. Update `.env` variables
4. Restart server
5. Test with real payments

---

## 📚 Database Integration

### Save Order to Database

Currently, orders are created but not saved. To persist:

**In `server/index.js`:**
```javascript
app.post('/api/razorpay/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt
    });
    
    // TODO: Save to database
    // await db.query('INSERT INTO orders (order_id, amount, status) VALUES (?, ?, ?)', 
    //   [order.id, amount, 'created']
    // );
    
    res.json({ success: true, order_id: order.id, amount, currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Update Order Status

**In verification endpoint:**
```javascript
if (expectedSignature === razorpay_signature) {
  // TODO: Update database
  // await db.query('UPDATE orders SET status = ? WHERE order_id = ?',
  //   ['paid', razorpay_order_id]
  // );
  res.json({ success: true, message: 'Payment verified successfully' });
}
```

---

## 🐛 Troubleshooting

### Error: "Invalid signature"

**Cause:** Signature verification failed
**Solution:**
- Verify `RAZOR_KEY_SECRET` is correct
- Ensure request body matches exactly
- Check order_id and payment_id are correct

### Error: "Cannot find module 'razorpay'"

**Solution:**
```powershell
cd server
npm install razorpay
```

### Error: "NEXT_PUBLIC_RAZOR_KEY_ID is undefined"

**Solution:**
- Create `frontend/.env.local`
- Add `NEXT_PUBLIC_RAZOR_KEY_ID=rzp_test_...`
- Restart frontend dev server

### Payment Modal Not Opening

**Causes:**
- Key ID might be wrong
- Razorpay SDK script not loaded
- Browser might have script blockers

**Solution:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_RAZOR_KEY_ID` in .env.local
- Try incognito mode (to disable extensions)

### Webhook Not Firing

**In Test Mode:**
- Use Razorpay CLI to listen locally
- Cannot trigger real webhooks locally
- Use test cards to simulate payments

**In Production:**
- Verify webhook URL is public/accessible
- Check webhook signing secret is correct
- Look for events in Razorpay Dashboard → Webhooks

---

## 📞 Links & Documentation

| Resource | Link |
|----------|------|
| Razorpay Docs | https://razorpay.com/docs |
| API Reference | https://razorpay.com/docs/api |
| Test Cards | https://razorpay.com/docs/payments/testing |
| Webhook Info | https://razorpay.com/docs/webhooks |
| Dashboard | https://dashboard.razorpay.com |

---

## ✅ Checklist

**Before Going Live:**
- [ ] Razorpay account created
- [ ] API keys retrieved
- [ ] Environment variables configured
- [ ] Tested payment flow locally with test card
- [ ] Database integration added (if needed)
- [ ] Webhook configured in Razorpay Dashboard
- [ ] CORS origin updated for production
- [ ] Switched to live mode in Razorpay Dashboard
- [ ] Live credentials updated in .env
- [ ] SSL/HTTPS enabled on production domain

---

## 🎯 Next Steps

1. ✅ Set up Razorpay account
2. ✅ Configure environment variables
3. ✅ Test locally with test cards
4. ✅ Integrate with your database (optional)
5. ✅ Deploy to production
6. ✅ Switch to live mode
7. ✅ Start accepting payments!

---

**Version:** 1.0.0  
**Last Updated:** December 2025

For questions, check Razorpay documentation or contact support.
