# 🚀 Complete Payment System - Quick Deploy Guide

**What You Got:** Full-stack, production-ready payment system with Razorpay + Stripe  
**Status:** ✅ Ready to deploy  
**Deployment Time:** ~30 minutes  

---

## 📦 Files Created

```
my-website/
├── payment-standalone.html              ✅ Payment UI (100% responsive)
├── php-payments/
│   ├── razorpay_create_order.php       ✅ Razorpay: Create order
│   ├── razorpay_verify.php             ✅ Razorpay: Verify signature
│   ├── razorpay_webhook.php            ✅ Razorpay: Handle webhooks
│   ├── stripe_create_session.php       ✅ Stripe: Create checkout
│   ├── stripe_webhook.php              ✅ Stripe: Handle webhooks
│   ├── success.php                     ✅ Success page (order details)
│   └── cancel.php                      ✅ Cancellation page
├── database-schema.sql                  ✅ MySQL tables (orders, refunds, disputes, webhooks)
├── composer.json                        ✅ PHP dependencies
├── .env.example                         ✅ Configuration template
├── PAYMENT_SETUP_GUIDE.md               ✅ 150+ line setup guide (local + production)
└── SECURITY_OPERATIONS_CHECKLIST.md     ✅ Pre-launch security verification

BONUS:
├── frontend/pages/payment.tsx           ✅ React/Next.js payment page (already done)
└── server/index.js                      ✅ Express webhooks (already done)
```

---

## ⚡ 30-Minute Deployment

### Step 1: Setup (5 min)

```bash
# 1. Copy .env template
cp .env.example .env

# 2. Edit .env with your credentials
# Get from:
# - Razorpay: https://dashboard.razorpay.com/app/settings/api-keys
# - Stripe: https://dashboard.stripe.com/apikeys
nano .env
```

### Step 2: Database (5 min)

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE my_website DEFAULT CHARSET utf8mb4;"

# 2. Import schema
mysql -u root -p my_website < database-schema.sql

# 3. Verify (should see 4 tables)
mysql -u root -p my_website -e "SHOW TABLES;"
```

### Step 3: PHP (5 min)

```bash
# 1. Install Composer dependencies
composer install

# 2. Set permissions
chmod 600 .env
chmod 755 php-payments/

# 3. Start PHP server
php -S localhost:8000
```

### Step 4: Test (15 min)

```bash
# 1. Open payment page
# Browser: http://localhost:8000/payment-standalone.html

# 2. Test Razorpay
# - Select: Razorpay (INR)
# - Amount: 150
# - Card: 4111 1111 1111 1111
# - Expiry: 12/25, CVV: 123
# - Pay → Should see success page

# 3. Test Stripe  
# - Select: Stripe (USD)
# - Amount: 150 (converts to $1.50)
# - Card: 4242 4242 4242 4242
# - Expiry: 12/25, CVV: 123
# - Pay → Should see success page

# 4. Check database
mysql -u root -p my_website -e "SELECT * FROM orders;"
# Should see 2 rows with 'paid' status
```

---

## 🔒 Security Setup (BEFORE Production)

### 1. Get API Keys

**Razorpay (5 minutes):**
```
1. Go: https://razorpay.com/
2. Sign up or login
3. Go: Settings → API Keys
4. Copy: Key ID and Key Secret
5. Copy to .env: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
6. Setup webhook: Settings → Webhooks
   URL: https://yourdomain.com/php-payments/razorpay_webhook.php
   Secret: Copy to .env: RAZORPAY_WEBHOOK_SECRET
```

**Stripe (5 minutes):**
```
1. Go: https://stripe.com/
2. Sign up or login
3. Go: Developers → API Keys
4. Copy: Publishable Key and Secret Key
5. Copy to .env: STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY
6. Setup webhook: Developers → Webhooks
   URL: https://yourdomain.com/php-payments/stripe_webhook.php
   Secret: Copy to .env: STRIPE_WEBHOOK_SECRET
```

### 2. Environment Verification

```bash
# Verify .env has all keys
grep -E "RAZORPAY_|STRIPE_|DB_" .env
# Should show all values filled in (no empty values)

# Verify no test keys remain
grep "test" .env
# Should return NOTHING (for production)

# Verify .env is protected
ls -la .env
# Should show: -rw------- (permissions 600)
```

### 3. HTTPS Setup

```bash
# Option A: Let's Encrypt (free)
sudo certbot certonly --standalone -d yourdomain.com

# Option B: Use existing cert from hosting provider

# Verify:
curl -I https://yourdomain.com
# Should return: 200 OK (not SSL errors)
```

---

## 📊 What Payment Data Flows Look Like

### Razorpay (INR) Flow
```
User fills payment form
    ↓
Frontend POST → /razorpay_create_order.php
    ↓
PHP creates Razorpay order via API
    ↓
Returns order_id + key to frontend
    ↓
Frontend loads Razorpay SDK (javascript)
    ↓
Razorpay modal opens → User enters card
    ↓
Razorpay processes → Returns payment_id + signature
    ↓
Frontend POST → /razorpay_verify.php (with signature)
    ↓
PHP verifies HMAC-SHA256 signature
    ↓
If valid → Update database order status = 'paid'
    ↓
Redirect to success.php
```

### Stripe (USD) Flow
```
User fills payment form
    ↓
Frontend POST → /stripe_create_session.php
    ↓
PHP creates Stripe session via API
    ↓
Returns session_id to frontend
    ↓
Frontend redirects to Stripe Checkout
    ↓
User completes payment at Stripe
    ↓
Stripe redirects back to success.php
    ↓
PHP fetches session from Stripe API to verify
    ↓
If verified → Update database order status = 'paid'
```

### Webhook Flow (Post-Payment)
```
Razorpay/Stripe processes payment
    ↓
Sends webhook POST to your endpoint
    ↓
Includes signature for verification
    ↓
PHP verifies signature (prevents fake webhooks)
    ↓
If valid → Update order status based on event
    ↓
Return 200 OK (tells gateway webhook received)
    ↓
Gateway logs as delivered
```

---

## 🗂️ Database Tables Explained

### `orders` Table
```sql
id              - Order ID (primary key)
provider        - 'razorpay' or 'stripe'
provider_order_id - Order ID from gateway (order_xxx or session_xxx)
payment_id      - Payment/transaction ID from gateway
amount          - Amount in smallest unit (paise for INR, cents for USD)
currency        - 'INR' or 'USD'
method          - 'card', 'upi', 'netbanking', 'wallet'
status          - 'pending', 'paid', 'failed', 'refunded'
user_ip         - Customer IP address
verified_at     - When payment was verified
created_at      - Order creation time
updated_at      - Last updated time
```

### `webhook_logs` Table
```sql
provider        - 'razorpay' or 'stripe'
event_type      - 'payment.captured', 'charge.refunded', etc.
event_id        - Unique event ID
signature_valid - Was signature valid?
processed       - Was event processed?
error           - Error message if failed
created_at      - When webhook was received
```

### `refunds` Table
```sql
order_id        - Links to orders table
refund_id       - Refund ID from gateway
amount          - Refund amount
reason          - Why refunded
status          - 'pending', 'processed', 'failed'
created_at      - When refund was requested
processed_at    - When refund completed
```

---

## 📈 Testing Data

### Razorpay Test Cards
```
✅ Success Payment:
Card: 4111 1111 1111 1111
Expiry: Any future (12/25)
CVV: Any 3 digits (123)
Result: AUTHORIZED & CAPTURED

❌ Payment Declined:
Card: 4000 0000 0000 0002
Expiry: Any future
CVV: Any 3 digits
Result: DECLINED
```

### Stripe Test Cards
```
✅ Success Payment:
Card: 4242 4242 4242 4242
Expiry: Any future (12/25)
CVV: Any 3 digits (123)
Result: SUCCESS

❌ Payment Declined:
Card: 4000 0000 0000 0002
Expiry: Any future
CVV: Any 3 digits
Result: DECLINED

⚠️ Requires Authentication:
Card: 4000 0025 0000 3155
Expiry: Any future
CVV: Any 3 digits
Result: 3D SECURE REQUIRED
```

---

## 🐛 Common Issues & Fixes

### Issue: "Razorpay key not found"
**Fix:**
```bash
# Make sure .env exists and has:
grep "RAZORPAY_KEY_ID=" .env
# If not, copy from .env.example:
cp .env.example .env
# Then edit with your keys
```

### Issue: "Database connection failed"
**Fix:**
```bash
# Verify database exists:
mysql -u root -p -e "SHOW DATABASES;"

# Verify user/password:
mysql -u root -p -e "SELECT USER();"

# Check .env has correct credentials:
grep "DB_" .env
```

### Issue: "Webhook not processing"
**Fix:**
```bash
# 1. Check webhook URL is HTTPS
# Dashboard → Webhooks → URL should start with https://

# 2. Verify signature secret
# .env should have WEBHOOK_SECRET

# 3. Test webhook manually:
curl -X POST https://yourdomain.com/php-payments/razorpay_webhook.php \
  -H "X-Razorpay-Signature: test" \
  -d '{"event":"payment.captured"}'

# 4. Check webhook logs:
mysql -u root -p my_website -e "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;"
```

### Issue: "CORS error" in browser console
**Fix:**
```php
// Add to top of php-payments/*.php files:
header('Access-Control-Allow-Origin: https://yourdomain.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
```

---

## 📚 Next Steps After Deployment

### Immediate (Day 1)
- [ ] Verify payments are being recorded in database
- [ ] Test refund process
- [ ] Monitor webhook delivery
- [ ] Check customer support for issues
- [ ] Review error logs

### Short-term (Week 1)
- [ ] Setup automated backups
- [ ] Configure monitoring alerts
- [ ] Train customer support on payment process
- [ ] Review PCI compliance checklist
- [ ] Plan API key rotation schedule

### Long-term (Month 1)
- [ ] Analyze payment trends (conversion rate, failure rate)
- [ ] Implement payment analytics dashboard
- [ ] Setup automated dispute/refund handling
- [ ] Plan payment optimization (A/B test gateways)
- [ ] Quarterly security audit

---

## 📞 Support Resources

**Razorpay:**
- Docs: https://razorpay.com/docs/
- Support: https://razorpay.com/support/
- Status: https://status.razorpay.com/

**Stripe:**
- Docs: https://stripe.com/docs/
- Support: https://support.stripe.com/
- Status: https://status.stripe.com/

**Your Files:**
- Setup Guide: `PAYMENT_SETUP_GUIDE.md`
- Security Checklist: `SECURITY_OPERATIONS_CHECKLIST.md`
- Database Schema: `database-schema.sql`

---

## ✅ Deployment Checklist

Before going live with real money:

- [ ] All environment variables in .env
- [ ] Database schema imported
- [ ] PHP dependencies installed (`composer install`)
- [ ] HTTPS certificate installed
- [ ] Test payments working (Razorpay & Stripe)
- [ ] Webhooks configured in both gateways
- [ ] Database backups scheduled
- [ ] Monitoring/alerts setup
- [ ] Error logging configured
- [ ] Customer support trained
- [ ] Security checklist reviewed

---

**Status:** ✅ Production-Ready  
**Deployment Time:** 30 minutes  
**Support:** See PAYMENT_SETUP_GUIDE.md for detailed instructions  

🎉 **You're all set! Deploy with confidence.**
