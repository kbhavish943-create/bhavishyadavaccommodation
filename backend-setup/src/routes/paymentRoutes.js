// src/routes/paymentRoutes.js
// Payment Processing Routes (Razorpay + Stripe)
// Week 2: Payment Gateway Integration

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * ============================================
 * RAZORPAY ROUTES
 * ============================================
 */

/**
 * POST /api/payments/razorpay/create-order
 * 
 * Creates a Razorpay order for payment
 * 
 * Request Body:
 *   {
 *     "bookingId": "ObjectId",
 *     "amount": 50000
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "orderId": "order_ABC123",
 *       "keyId": "rzp_live_ABC",
 *       "amount": 50000,
 *       "currency": "INR"
 *     }
 *   }
 * 
 * Purpose:
 *   - Validates booking is pending
 *   - Verifies availability lock is active (not expired)
 *   - Creates order in Razorpay
 *   - Stores orderId in booking
 *   - Frontend receives orderId + keyId to open Razorpay modal
 * 
 * Security:
 *   - Verifies booking ownership (TODO: add auth middleware)
 *   - Validates amount matches booking.pricing.totalAmount
 *   - Uses MongoDB transactions for atomicity
 */
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);

/**
 * POST /api/payments/razorpay/webhook
 * 
 * Razorpay webhook endpoint for payment events
 * 
 * Webhook Events Handled:
 *   - payment.authorized (payment successful)
 *   - payment.captured (amount captured)
 *   - payment.failed (payment failed)
 * 
 * Purpose:
 *   - Verifies Razorpay webhook signature (CRITICAL)
 *   - Updates booking status to 'confirmed' on success
 *   - Marks availability as 'booked' (permanent lock)
 *   - Logs payment in Payment collection
 *   - On failure: Keeps availability locked with TTL (auto-unlock in 15 min)
 * 
 * Security:
 *   - HMAC-SHA256 signature verification REQUIRED
 *   - Must verify signature before any database writes
 *   - Webhook secret stored in .env (RAZORPAY_WEBHOOK_SECRET)
 * 
 * Setup:
 *   1. Razorpay Dashboard → Settings → Webhooks
 *   2. Add endpoint: https://yourdomain.com/api/payments/razorpay/webhook
 *   3. Copy webhook secret to .env
 *   4. Select events: payment.authorized, payment.captured, payment.failed
 */
router.post('/razorpay/webhook', paymentController.razorpayWebhook);

/**
 * ============================================
 * STRIPE ROUTES
 * ============================================
 */

/**
 * POST /api/payments/stripe/create-intent
 * 
 * Creates a Stripe payment intent
 * 
 * Request Body:
 *   {
 *     "bookingId": "ObjectId",
 *     "amount": 50000
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "clientSecret": "pi_ABC123_secret_XYZ",
 *       "paymentIntentId": "pi_ABC123",
 *       "amount": 50000,
 *       "publishableKey": "pk_live_ABC"
 *     }
 *   }
 * 
 * Purpose:
 *   - Validates booking is pending
 *   - Verifies availability lock is active
 *   - Creates payment intent in Stripe
 *   - Returns clientSecret + publishableKey for frontend
 *   - Frontend uses clientSecret to handle payment with Stripe.js
 */
router.post('/stripe/create-intent', paymentController.createStripePaymentIntent);

/**
 * POST /api/payments/stripe/webhook
 * 
 * Stripe webhook endpoint for payment events
 * 
 * Webhook Events Handled:
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 * 
 * Purpose:
 *   - Verifies Stripe webhook signature
 *   - Updates booking to 'confirmed' on success
 *   - Marks availability as 'booked'
 *   - On failure: Keeps booking pending, availability locked with TTL
 * 
 * Security:
 *   - Stripe signature verification REQUIRED
 *   - Use raw body for signature verification
 *   - Webhook secret stored in .env (STRIPE_WEBHOOK_SECRET)
 * 
 * Setup:
 *   1. Stripe Dashboard → Developers → Webhooks
 *   2. Add endpoint: https://yourdomain.com/api/payments/stripe/webhook
 *   3. Copy signing secret to .env
 *   4. Select events: payment_intent.succeeded, payment_intent.payment_failed
 */
router.post('/stripe/webhook', paymentController.stripeWebhook);

/**
 * ============================================
 * STATUS ROUTES
 * ============================================
 */

/**
 * GET /api/payments/:bookingId/status
 * 
 * Get payment status for a booking
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "bookingId": "ObjectId",
 *       "bookingStatus": "pending|confirmed|completed",
 *       "paymentStatus": "pending|completed|failed|refunded",
 *       "amount": 50000,
 *       "paidAmount": 50000,
 *       "transactionId": "txn_ABC123",
 *       "paymentDate": "2025-12-23T10:30:00Z"
 *     }
 *   }
 */
router.get('/:bookingId/status', paymentController.getPaymentStatus);

/**
 * ============================================
 * MIDDLEWARE NOTES
 * ============================================
 * 
 * TODO: Add auth middleware to verify user owns booking
 * TODO: Add rate limiting for create-order endpoints
 * TODO: Add input validation middleware
 * 
 * Current Validation:
 *   - Basic checks in controller
 *   - Amount vs booking.pricing.totalAmount
 *   - Booking status check
 *   - Availability lock verification
 */

module.exports = router;
