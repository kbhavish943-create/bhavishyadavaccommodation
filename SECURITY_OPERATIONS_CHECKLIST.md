# 🔒 Payment System Security & Operations Checklist

**Use this checklist before going live with real payments.**

---

## Pre-Launch Security Verification (CRITICAL)

### 1. API Credentials Management

- [ ] **All API keys in `.env` file only**
  ```bash
  grep -r "rzp_\|sk_\|pk_" src/ server/ --include="*.js" --include="*.php"
  # Should return NOTHING
  ```

- [ ] **`.env` file NOT in version control**
  ```bash
  # Check .gitignore
  cat .gitignore | grep "\.env"
  # Should show ".env"
  ```

- [ ] **`.env` file permissions restricted**
  ```bash
  ls -la .env
  # Should show: -rw------- (600)
  chmod 600 .env
  ```

- [ ] **No API keys in logs or error messages**
  ```bash
  # Test payment and check logs
  tail logs/payment.log | grep -i "key\|secret\|token"
  # Should return NOTHING
  ```

- [ ] **Environment variable loading verified**
  ```php
  // Test in PHP
  echo getenv('RAZORPAY_KEY_ID');  // Should print key
  echo getenv('DB_PASSWORD');      // Should print password
  ```

### 2. HTTPS/SSL Configuration

- [ ] **SSL certificate valid and installed**
  ```bash
  # Check certificate
  openssl s_client -connect yourdomain.com:443
  # Should show "Verify return code: 0 (ok)"
  ```

- [ ] **Mixed content warning fixed**
  ```bash
  # All resources should load via HTTPS
  # Test in browser DevTools → Security tab
  ```

- [ ] **HSTS header enabled (prevent downgrade attacks)**
  ```php
  // Add to payment endpoints:
  header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
  ```

- [ ] **Certificate auto-renewal configured**
  ```bash
  # For Let's Encrypt:
  sudo certbot renew --dry-run
  
  # Setup auto-renewal:
  # Add cron: 0 3 * * * /usr/bin/certbot renew --quiet
  ```

---

## Webhook Security (CRITICAL)

### 1. Signature Verification

- [ ] **Razorpay signatures verified on every webhook**
  ```php
  // razorpay_webhook.php should have:
  $expectedSignature = hash_hmac('sha256', $body, RAZORPAY_WEBHOOK_SECRET);
  if (!hash_equals($expectedSignature, $webhook_signature)) {
      die('Invalid signature');
  }
  ```

- [ ] **Stripe signatures verified on every webhook**
  ```php
  // stripe_webhook.php should have:
  $event = \Stripe\Webhook::constructEvent(
      $request_body, $sig_header, STRIPE_WEBHOOK_SECRET
  );
  ```

- [ ] **Webhook endpoints don't require authentication**
  ✓ OK: Signature verification is sufficient
  ✗ NO: Don't add API key checks (webhook verification is the auth)

- [ ] **Test invalid signatures are rejected**
  ```bash
  # Send webhook with wrong signature
  curl -X POST http://localhost:8000/php-payments/razorpay_webhook.php \
    -H "X-Razorpay-Signature: invalid_signature" \
    -d "..."
  # Should return 401 Unauthorized
  ```

### 2. Webhook Replay Attack Prevention

- [ ] **Webhook event IDs tracked to prevent duplicates**
  ```sql
  -- In webhook_logs table:
  SELECT event_id FROM webhook_logs WHERE event_id = ?;
  IF (event exists) RETURN early;
  ```

- [ ] **Idempotent webhook handlers**
  ```php
  // If webhook processed twice, same result:
  UPDATE orders SET status = ? WHERE provider_order_id = ?;
  // Not: INSERT (would fail with duplicate)
  ```

- [ ] **Webhook retry logic implemented**
  ```php
  // If webhook processing fails:
  // 1. Log failure
  // 2. Return 500 (gateway will retry)
  // 3. Set processed = FALSE in webhook_logs
  ```

### 3. Webhook Delivery Security

- [ ] **Webhook URL is HTTPS**
  ```bash
  # Check in gateway dashboard
  # URL: https://yourdomain.com/php-payments/razorpay_webhook.php
  # (NOT http://)
  ```

- [ ] **Webhook signature secret stored safely**
  ```bash
  # Should be in .env, NOT in code
  grep "WEBHOOK_SECRET" .env
  grep -r "WEBHOOK_SECRET" src/ server/ --include="*.php" --include="*.js"
  # Second command should find only in config/imports
  ```

- [ ] **Webhook response is valid JSON with 200 OK**
  ```php
  // Always respond:
  http_response_code(200);
  echo json_encode(['received' => true]);
  exit;
  ```

- [ ] **Webhook logging enabled for debugging**
  ```php
  // Log every webhook:
  error_log('Webhook: ' . $event_type . ' - ' . json_encode($event_data));
  
  // Monitor logs:
  tail -f /var/log/php-errors.log | grep Webhook
  ```

---

## Database Security

### 1. Credentials & Access Control

- [ ] **Database password in `.env` only**
  ```bash
  grep "DB_PASSWORD" .env
  # Should show encrypted or complex password
  grep -r "DB_PASSWORD" src/ server/ --include="*.php" --include="*.js"
  # Should show only in config loading, not hardcoded
  ```

- [ ] **Database user has minimal required permissions**
  ```sql
  -- Create dedicated DB user for payments:
  CREATE USER 'payment_app'@'localhost' IDENTIFIED BY 'strong_password';
  GRANT SELECT, INSERT, UPDATE ON my_website.orders TO 'payment_app'@'localhost';
  GRANT SELECT ON my_website.webhook_logs TO 'payment_app'@'localhost';
  -- NO DROP, DELETE, or other privileges
  ```

- [ ] **Database accessible only from app server**
  ```bash
  # Check MySQL only listens to localhost:
  netstat -tlnp | grep 3306
  # Should show 127.0.0.1:3306 (not 0.0.0.0:3306)
  ```

### 2. Data Protection

- [ ] **Sensitive payment data NOT stored**
  ```sql
  -- DO store:
  SELECT * FROM orders LIMIT 1;
  -- Should show: id, provider, amount, status, etc.
  
  -- DO NOT store:
  -- Credit card numbers, CVV, API responses with full card data
  ```

- [ ] **Payment verification happens server-side**
  ```php
  // ✓ CORRECT: Verify on server
  if (verify_signature($payment_id, $signature)) {
      UPDATE orders SET status = 'paid';
  }
  
  // ✗ WRONG: Trust frontend
  if ($_POST['status'] === 'paid') {
      UPDATE orders SET status = 'paid';
  }
  ```

- [ ] **PCI Compliance - no raw card data**
  ```php
  // ✓ CORRECT: Use gateway APIs
  $razorpay->payments->fetch($payment_id);
  
  // ✗ WRONG: Never do this:
  // $_POST['card_number']
  // mysqli_query("INSERT INTO orders (card_number) VALUES (?)");
  ```

### 3. SQL Injection Prevention

- [ ] **All queries use prepared statements**
  ```php
  // ✓ CORRECT:
  $stmt = $mysqli->prepare("UPDATE orders SET status = ? WHERE id = ?");
  $stmt->bind_param("si", $status, $id);
  $stmt->execute();
  
  // ✗ WRONG:
  // mysqli_query("UPDATE orders SET status = '$status' WHERE id = $id");
  ```

- [ ] **User input validated before database**
  ```php
  // Validate:
  if (!is_numeric($amount) || $amount < 1) {
      die('Invalid amount');
  }
  if (!in_array($method, ['card', 'upi', 'netbanking'])) {
      die('Invalid method');
  }
  ```

- [ ] **Test SQL injection protection**
  ```bash
  # Try to inject:
  curl -X POST http://localhost:8000/razorpay_create_order.php \
    -d '{"amount": "999999; DROP TABLE orders; --"}'
  # Should safely reject, NOT execute DROP
  ```

---

## API Endpoint Security

### 1. Request Validation

- [ ] **Content-Type header validated**
  ```php
  // Check request is JSON:
  if ($_SERVER['CONTENT_TYPE'] !== 'application/json') {
      http_response_code(400);
      die('Invalid content type');
  }
  ```

- [ ] **Request size limits enforced**
  ```php
  // Prevent large payloads:
  $max_size = 1024 * 100; // 100KB
  if (strlen(file_get_contents('php://input')) > $max_size) {
      http_response_code(413);
      die('Payload too large');
  }
  ```

- [ ] **JSON parsing errors handled**
  ```php
  $data = json_decode(file_get_contents('php://input'), true);
  if (json_last_error() !== JSON_ERROR_NONE) {
      http_response_code(400);
      die('Invalid JSON: ' . json_last_error_msg());
  }
  ```

### 2. Rate Limiting

- [ ] **Rate limiting implemented on payment endpoints**
  ```php
  // Simple rate limit:
  $key = 'payment_' . $_SERVER['REMOTE_ADDR'];
  $count = redis()->incr($key);
  redis()->expire($key, 60);
  
  if ($count > 10) { // 10 requests per minute
      http_response_code(429);
      die('Too many requests');
  }
  ```

- [ ] **Test rate limiting works**
  ```bash
  # Send 15 requests rapidly:
  for i in {1..15}; do
    curl -X POST http://localhost:8000/razorpay_create_order.php -d '...'
  done
  # Requests 11-15 should get 429 Too Many Requests
  ```

### 3. CORS & Headers

- [ ] **CORS headers configured correctly**
  ```php
  // Allow only your domain:
  header("Access-Control-Allow-Origin: https://yourdomain.com");
  // NOT: header("Access-Control-Allow-Origin: *");
  ```

- [ ] **Security headers added**
  ```php
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: DENY');
  header('X-XSS-Protection: 1; mode=block');
  header('Referrer-Policy: strict-origin-when-cross-origin');
  header('Content-Security-Policy: default-src \'self\'');
  ```

- [ ] **OPTIONS preflight handled**
  ```php
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(200);
      exit;
  }
  ```

---

## Error Handling & Logging

### 1. Secure Logging

- [ ] **Payment endpoints log transactions**
  ```php
  // Log successfully (without sensitive data):
  error_log("Payment processed: Order {$order_id}, Amount {$amount}, Status {$status}");
  
  // DON'T log:
  // error_log("API Key: $razorpay_key");
  // error_log("Full response: " . json_encode($response));
  ```

- [ ] **Failed payments logged for review**
  ```sql
  -- Query failed payments:
  SELECT * FROM orders WHERE status = 'failed' AND updated_at > DATE_SUB(NOW(), INTERVAL 1 DAY);
  ```

- [ ] **Error logs protected from public access**
  ```bash
  # Logs should NOT be web-accessible:
  curl https://yourdomain.com/logs/payment.log
  # Should return 403 Forbidden
  
  # Check .htaccess or nginx config:
  # <Files ~ "\.log$">
  #     Deny from all
  # </Files>
  ```

### 2. Error Message Security

- [ ] **Users don't see sensitive errors**
  ```php
  // ✓ CORRECT: Generic message to user
  echo json_encode(['error' => 'Payment processing failed. Please try again.']);
  
  // ✗ WRONG: Leak internal info
  // echo json_encode(['error' => 'Database connection failed: ' . $mysqli->error]);
  ```

- [ ] **Detailed errors logged internally**
  ```php
  // For internal debugging:
  error_log("Database error: " . $mysqli->error);
  
  // For user:
  echo json_encode(['error' => 'An error occurred. Contact support.']);
  ```

---

## Production Operations

### 1. Monitoring & Alerts

- [ ] **Payment processing monitored 24/7**
  ```bash
  # Setup alerts for:
  # - More than N failed payments per hour
  # - Webhook processing latency > 5 seconds
  # - Database connection failures
  # - Disk space < 10% remaining
  ```

- [ ] **Daily payment summary generated**
  ```sql
  -- Daily cron job:
  SELECT 
    DATE(created_at) as date,
    provider,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as successful
  FROM orders
  GROUP BY DATE(created_at), provider
  ORDER BY created_at DESC
  LIMIT 30;
  ```

- [ ] **Failed webhook logs reviewed daily**
  ```sql
  SELECT * FROM webhook_logs 
  WHERE processed = FALSE OR error IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 50;
  ```

### 2. Key Rotation & Updates

- [ ] **API keys rotated every 90 days**
  ```bash
  # Calendar reminder set for key rotation
  # Process:
  # 1. Generate new key in provider dashboard
  # 2. Update .env with new key
  # 3. Wait 24 hours
  # 4. Delete old key from dashboard
  ```

- [ ] **PHP & dependencies kept updated**
  ```bash
  # Check versions:
  php -v  # Should be 8.0+
  composer update  # Check for security updates
  
  # Subscribe to:
  # - PHP security advisories
  # - Composer dependency alerts
  # - Gateway API changelog
  ```

### 3. Backup & Disaster Recovery

- [ ] **Database backed up daily**
  ```bash
  # Automated backup:
  0 2 * * * mysqldump -u root -p my_website | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
  
  # Keep 30 days of backups
  find /backups -name "db_*.sql.gz" -mtime +30 -delete
  ```

- [ ] **Backups tested monthly**
  ```bash
  # Restore test:
  # 1. Create test database
  # 2. Restore from backup
  # 3. Verify all tables and data intact
  # 4. Delete test database
  ```

- [ ] **Disaster recovery plan documented**
  ```
  - Database server down: Restore from latest backup
  - Payment gateway unreachable: Queue orders, retry hourly
  - Webhook handler down: Manual webhook processing
  - API key compromised: Rotate immediately
  ```

---

## Compliance & Documentation

### 1. Data Protection (GDPR, Privacy)

- [ ] **Data retention policy documented**
  ```
  - Payment data: Keep 7 years (tax/legal)
  - Failed payment attempts: Keep 1 year
  - Webhook logs: Keep 90 days
  - User data: Delete on request (right to be forgotten)
  ```

- [ ] **User consent collected**
  ```html
  <!-- Before payment:-->
  <input type="checkbox" required>
  I agree to payment terms and <a href="/privacy">privacy policy</a>
  ```

- [ ] **Privacy policy includes payment information**
  ```
  - What data is collected (order amount, email)
  - How data is protected (encryption, tokens)
  - Third parties with access (Razorpay, Stripe)
  - User rights (access, deletion, portability)
  ```

### 2. PCI DSS Compliance

- [ ] **PCI DSS checklist completed**
  ```
  ✓ Firewall configured
  ✓ No default passwords
  ✓ Protect data in transit (HTTPS)
  ✓ Vulnerable software patched
  ✓ Security policy in place
  ✓ Restricted access by business need
  ✓ Identify and authenticate access
  ✓ Monitor and test security
  ✓ Security policy maintained
  ```

- [ ] **No credit card data stored locally**
  ```php
  // Payment gateways handle card data, NOT your server
  // You store: order_id, amount, status, gateway_payment_id
  // You DON'T store: card number, CVV, expiry
  ```

### 3. Documentation

- [ ] **API documentation complete**
  ```markdown
  # Razorpay Endpoint
  POST /php-payments/razorpay_create_order.php
  
  Request: { amount: number, method: string }
  Response: { success: boolean, orderId: string, keyId: string }
  Errors: 400 (Invalid input), 500 (Server error)
  ```

- [ ] **Runbook for common issues**
  ```
  1. Webhook not processing
  2. Payment succeeds but order not updated
  3. Gateway API down (fallback plan)
  4. High failure rate investigation
  5. Customer dispute/chargeback handling
  ```

- [ ] **Incident response plan ready**
  ```
  - On security incident: Steps to containment
  - Customer notification template
  - Stakeholder communication plan
  - Post-incident review process
  ```

---

## Final Verification Checklist

### Go-Live Approval

- [ ] **All checkboxes above completed** ✅
- [ ] **Penetration testing passed** (optional but recommended)
- [ ] **Load testing done** (can handle peak traffic)
- [ ] **Staged rollout plan** (10% → 50% → 100%)
- [ ] **Customer support trained** on refund process
- [ ] **Monitoring alerts tested** (receives alerts correctly)
- [ ] **Incident response team assigned** (who handles outages)
- [ ] **Legal review completed** (compliance, terms, privacy)

### Day 1 Monitoring

After going live:
1. Monitor webhook delivery rate (should be 100%)
2. Check payment success rate (target: >98%)
3. Review customer support tickets for issues
4. Verify database backups running
5. Confirm monitoring alerts working
6. Watch for any error patterns

### Weekly Review

Every week:
1. Review failed payments (< 2% is normal)
2. Check for suspicious payment patterns
3. Rotate webhook logs (archive old logs)
4. Verify API rate limits not exceeded
5. Test failover procedures

---

**Checklist Version:** 1.0  
**Last Updated:** December 2024  
**Compliance:** PCI DSS, GDPR, CCPA  
**Status:** Ready for Production ✅
