# Multi-Gateway Payment System Setup & Deployment Guide

**Status:** Production-Ready  
**Supported Gateways:** Razorpay (INR) + Stripe (USD)  
**Tech Stack:** PHP 7.4+, MySQL 5.7+, Express.js (webhooks)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Gateway Setup](#gateway-setup)
3. [Local Development](#local-development)
4. [Webhook Configuration](#webhook-configuration)
5. [Testing Checklist](#testing-checklist)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- PHP 7.4+ with cURL extension
- MySQL 5.7+ or MariaDB 10.3+
- Composer package manager
- ngrok for webhook testing (optional)
- Razorpay & Stripe accounts

### Installation (5 minutes)

```bash
# 1. Clone/download project
cd my-website

# 2. Install PHP dependencies
composer install

# 3. Create .env file
cp .env.example .env

# 4. Configure credentials in .env
# Edit .env with your Razorpay & Stripe keys

# 5. Setup database
mysql -u root -p < database-schema.sql

# 6. Start local server
php -S localhost:8000
```

---

## 🔐 Gateway Setup

### A. Razorpay (For INR Payments)

**1. Create Razorpay Account**
- Visit: https://razorpay.com/
- Sign up → Create business account
- Verify email and phone

**2. Get API Keys**
- Login to: https://dashboard.razorpay.com
- Navigate: Settings → API Keys
- Copy:
  - `Key ID` → RAZORPAY_KEY_ID
  - `Key Secret` → RAZORPAY_KEY_SECRET

**3. Setup Webhooks**
- Go to Settings → Webhooks → Add new webhook
- URL: `https://yourdomain.com/php-payments/razorpay_webhook.php`
- Events to enable:
  - `payment.authorized`
  - `payment.failed`
  - `refund.created`
- Copy webhook secret → RAZORPAY_WEBHOOK_SECRET

**4. Generate Webhook Secret**
```bash
# Razorpay provides this automatically in dashboard
# Copy the "Webhook Secret" value to .env
```

### B. Stripe (For USD/Global Payments)

**1. Create Stripe Account**
- Visit: https://stripe.com
- Sign up → Create account
- Verify email

**2. Get API Keys**
- Login to: https://dashboard.stripe.com
- Navigate: Developers → API Keys
- Copy:
  - `Publishable Key` → STRIPE_PUBLISHABLE_KEY
  - `Secret Key` → STRIPE_SECRET_KEY

**3. Setup Webhooks**
- Go to Developers → Webhooks → Add endpoint
- URL: `https://yourdomain.com/php-payments/stripe_webhook.php`
- Events to listen for:
  - `checkout.session.completed`
  - `charge.refunded`
  - `charge.dispute.created`
- Copy signing secret → STRIPE_WEBHOOK_SECRET

**4. Enable Test Mode**
```
Make sure "View test data" toggle is ON in dashboard
All API keys should have "test" prefix (sk_test_*, pk_test_*)
```

---

## 💻 Local Development

### Database Setup

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE my_website DEFAULT CHARSET utf8mb4;"

# 2. Import schema
mysql -u root -p my_website < database-schema.sql

# 3. Verify tables
mysql -u root -p -e "USE my_website; SHOW TABLES;"
```

Expected tables:
- `orders` - Payment transactions
- `refunds` - Refund history
- `disputes` - Chargebacks/disputes
- `webhook_logs` - Webhook event logs

### Start Development Server

```bash
# Terminal 1: PHP Development Server
cd /path/to/my-website
php -S localhost:8000

# Terminal 2: Webhook Testing with ngrok (if testing locally)
ngrok http 8000
# This gives you a public URL like: https://xxxx-xx-xxx-xxx-xx.ngrok.io

# Terminal 3: Node.js webhook receiver (if using Express)
cd server
npm start
```

### Test Payment Flow

1. Open: `http://localhost:8000/payment-standalone.html`
2. Select Payment Method (Card, UPI, etc.)
3. Choose Gateway (Razorpay or Stripe)
4. Enter Amount: `150` (INR for Razorpay, converted to USD for Stripe)
5. Click "Pay"

### Test Cards

#### Razorpay (INR)
```
Card: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Result: Payment Success
```

#### Stripe (USD)
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Result: Payment Success

Card: 4000 0025 0000 3155
Result: Payment Declined (for testing failures)
```

---

## 🔔 Webhook Configuration

### Local Testing with ngrok

```bash
# 1. Start ngrok
ngrok http 8000

# Output:
# Forwarding    https://abc123.ngrok.io -> http://localhost:8000

# 2. Update .env
APP_URL=https://abc123.ngrok.io

# 3. Update Gateway Webhooks
# Go to Razorpay & Stripe dashboards
# Change webhook URL to:
# https://abc123.ngrok.io/php-payments/razorpay_webhook.php
# https://abc123.ngrok.io/php-payments/stripe_webhook.php

# 4. View webhook requests
# ngrok shows requests in real-time at http://127.0.0.1:4040
```

### Production Webhook URLs

Once deployed to production:
- Razorpay: `https://yourdomain.com/php-payments/razorpay_webhook.php`
- Stripe: `https://yourdomain.com/php-payments/stripe_webhook.php`

### Testing Webhooks

```bash
# Send test webhook manually
curl -X POST http://localhost:8000/php-payments/razorpay_webhook.php \
  -H "X-Razorpay-Signature: your_signature" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "order_id": "order_test123",
          "amount": 15000
        }
      }
    }
  }'
```

---

## ✅ Testing Checklist

### Before Going Live

- [ ] **Database**
  - [ ] All tables created successfully
  - [ ] `orders` table stores payments correctly
  - [ ] Indexes created for performance

- [ ] **Razorpay Integration**
  - [ ] Account created and verified
  - [ ] API keys retrieved and added to .env
  - [ ] Test payment flow works end-to-end
  - [ ] Webhook endpoint configured
  - [ ] Webhook signature verification working
  - [ ] Test 3 payment methods: Card, UPI, Netbanking
  - [ ] Success page displays correctly
  - [ ] Database records payment after verification

- [ ] **Stripe Integration**
  - [ ] Account created and verified
  - [ ] API keys retrieved and added to .env
  - [ ] Test payment session creation
  - [ ] Redirect to Stripe Checkout works
  - [ ] Success page displays correctly after return
  - [ ] Webhook endpoint configured
  - [ ] Webhook signature verification working
  - [ ] Database records payment correctly

- [ ] **Frontend**
  - [ ] Payment page loads: `/payment-standalone.html`
  - [ ] Gateway selection works (Razorpay ↔ Stripe)
  - [ ] Amount input validation working
  - [ ] Payment method selection working
  - [ ] UI is responsive on mobile
  - [ ] Test cards display correctly for each gateway
  - [ ] Error messages display properly
  - [ ] Loading spinner shows during processing

- [ ] **Security**
  - [ ] All credentials in .env file (not in code)
  - [ ] HTTPS enabled (localhost exception for dev)
  - [ ] API keys never logged or exposed
  - [ ] Webhook signatures verified
  - [ ] Request validation in place
  - [ ] SQL injection protection (prepared statements)
  - [ ] CORS headers configured correctly
  - [ ] Rate limiting implemented
  - [ ] API keys rotated regularly

- [ ] **Error Handling**
  - [ ] Network errors caught and reported
  - [ ] Failed payments handled gracefully
  - [ ] Duplicate order prevention
  - [ ] Timeout handling (30+ seconds)
  - [ ] Missing credentials detected
  - [ ] Invalid data rejected with messages

---

## 🚀 Production Deployment

### 1. Choose Hosting

**Recommended Hosting Options:**
- **VPS**: DigitalOcean, AWS Lightsail, Linode ($5-20/mo)
- **Shared Hosting**: GoDaddy, Bluehost, HostGator (with Composer support)
- **Cloud**: AWS EC2, Google Cloud, Azure App Service

**Why VPS over Shared Hosting?**
- Full control over PHP/MySQL versions
- Can run background jobs for webhook processing
- Better performance for payment processing
- Can use custom domains for webhooks
- SSL certificates easier to manage

### 2. Pre-Deployment Checklist

```bash
# 1. Install production PHP
php -v  # Should be 7.4+
php -m | grep curl  # cURL must be enabled
php -m | grep mysqli  # MySQLi must be enabled

# 2. Set proper permissions
chmod 600 .env  # Only app can read credentials
chmod 755 php-payments/  # Webhooks accessible
chmod 700 logs/  # Log files protected

# 3. Production .env settings
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error
SENTRY_ENVIRONMENT=production

# 4. Update success/cancel URLs
# In stripe_create_session.php:
# success_url: https://yourdomain.com/php-payments/success.php
# cancel_url: https://yourdomain.com/php-payments/cancel.php
```

### 3. SSL Certificate (HTTPS)

```bash
# Option A: Let's Encrypt (Free)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Option B: Cloudflare (Free + Protection)
# Setup Cloudflare nameservers in domain registrar
# Enable "Full" SSL mode in Cloudflare

# Verify HTTPS
curl https://yourdomain.com  # Should work without warnings
```

### 4. Database Backup

```bash
# Automated daily backup
# Add to crontab: 0 2 * * * mysqldump -u user -p pass db_name > /backup/db_$(date +\%Y\%m\%d).sql

# Manual backup
mysqldump -u root -p my_website > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p my_website < backup_20250101.sql
```

### 5. Switch to Live API Keys

```bash
# In .env:
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=rzp_live_your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=whsec_your_live_webhook_secret

STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Verify no "test" prefixes remain
grep "test" .env  # Should return nothing
```

### 6. Update Webhook URLs

**Razorpay Dashboard:**
- Settings → Webhooks
- Change URL: `https://yourdomain.com/php-payments/razorpay_webhook.php`

**Stripe Dashboard:**
- Developers → Webhooks
- Change URL: `https://yourdomain.com/php-payments/stripe_webhook.php`

### 7. Monitor & Alert

```bash
# Setup error monitoring
# Option A: Sentry
# Get DSN from https://sentry.io
# Add to .env: SENTRY_DSN=https://...

# Option B: Check webhook logs regularly
SELECT * FROM webhook_logs WHERE processed = FALSE OR error IS NOT NULL;

# Option C: Email alerts on payment failures
# Add cron job to check failed payments:
0 */6 * * * php /path/to/check_failed_payments.php
```

---

## 🔧 Troubleshooting

### Issue: "Razorpay credentials not configured"
**Solution:**
```bash
# Check .env file exists and is readable
ls -la .env

# Verify keys are set
grep "RAZORPAY_KEY_ID" .env

# Check PHP can read .env
php -r "require_once '.env.php'; echo RAZORPAY_KEY_ID;"
```

### Issue: Webhook signature verification fails
**Solution:**
```bash
# 1. Verify you're using correct webhook secret
echo $RAZORPAY_WEBHOOK_SECRET

# 2. Check signature format in request headers
# X-Razorpay-Signature should be present

# 3. Enable logging to see signature mismatch
// Add to webhook handler:
error_log("Expected: $expectedSignature");
error_log("Received: $signature");
```

### Issue: "CORS error" when calling API
**Solution:**
```php
// Add CORS headers to all PHP endpoints:
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
```

### Issue: Payment succeeds but database doesn't update
**Solution:**
```bash
# 1. Check database connection
mysql -u root -p -e "USE my_website; SELECT COUNT(*) FROM orders;"

# 2. Check webhook logs
SELECT * FROM webhook_logs WHERE processed = FALSE;

# 3. Check PHP error log
tail -f /var/log/php-errors.log

# 4. Verify webhook is being called
// Add at start of webhook handler:
error_log("Webhook received: " . file_get_contents('php://input'));
```

### Issue: ngrok tunnel keeps disconnecting
**Solution:**
```bash
# Upgrade ngrok
ngrok version

# Use ngrok with authentication token
ngrok config add-authtoken your_auth_token
ngrok http 8000

# Or use alternative: cloudflare tunnel
# curl -L https://pkg.cloudflare.com/cloudflare-release-key.gpg | apt-key add -
# apt-get install -y cloudflared
# cloudflared tunnel create my-website
# cloudflared tunnel route dns my-website yourdomain.com
```

### Issue: Test payment works but production fails
**Solution:**
```bash
# 1. Verify you switched to LIVE keys
grep "rzp_live" .env
grep "pk_live\|sk_live" .env

# 2. Check payment amounts are correct (in paise/cents)
# INR: amount × 100 (₹150 = 15000)
# USD: amount × 100 ($1.50 = 150)

# 3. Verify HTTPS is working
curl -I https://yourdomain.com

# 4. Check webhook URLs are publicly accessible
curl https://yourdomain.com/php-payments/razorpay_webhook.php
```

---

## 📞 Support Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Stripe Docs**: https://stripe.com/docs/
- **PHP cURL**: https://www.php.net/manual/en/book.curl.php
- **MySQL Documentation**: https://dev.mysql.com/doc/

---

## 🔒 Security Reminders

✅ **DO:**
- Store all credentials in `.env` file
- Use HTTPS everywhere
- Verify all webhook signatures
- Use prepared statements (no SQL injection)
- Rotate API keys periodically
- Monitor webhook logs regularly
- Log failed payments for review
- Use strong database passwords

❌ **DON'T:**
- Commit `.env` file to GitHub
- Log API keys or sensitive data
- Trust unverified webhooks
- Store plain credit card data
- Use test keys in production
- Disable SSL certificate verification
- Hardcode credentials in code
- Expose error messages to users

---

## 📊 File Structure

```
my-website/
├── payment-standalone.html          # Frontend payment UI
├── php-payments/
│   ├── razorpay_create_order.php   # Create Razorpay order
│   ├── razorpay_verify.php         # Verify payment signature
│   ├── razorpay_webhook.php        # Handle Razorpay webhooks
│   ├── stripe_create_session.php   # Create Stripe session
│   ├── stripe_webhook.php          # Handle Stripe webhooks
│   ├── success.php                 # Success page
│   └── cancel.php                  # Cancellation page
├── database-schema.sql              # MySQL schema
├── composer.json                    # PHP dependencies
├── .env.example                     # Configuration template
├── .env                             # (Create this locally)
└── server/                          # Node.js webhook handlers
    ├── index.js
    └── routes/payment.js
```

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Production-Ready ✅
