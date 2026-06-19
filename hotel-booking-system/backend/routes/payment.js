/**
 * Payment Routes
 * Razorpay and Stripe integration for booking payments
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const { authenticateToken, requireCustomer, sendSuccess, sendError } = require('../middleware/auth');

// Note: Install these packages: npm install razorpay stripe

// ============================================================
// 1. RAZORPAY - CREATE ORDER
// ============================================================

/**
 * POST /api/payment/razorpay/create-order
 * Create Razorpay order for booking
 * Required: booking_id
 */
router.post('/razorpay/create-order', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return sendError(res, 400, 'Booking ID is required', 'MISSING_FIELD');
    }

    // Check if Razorpay is enabled
    const [settings] = await pool.execute(
      'SELECT setting_value FROM website_settings WHERE setting_key = ?',
      ['razorpay_enabled']
    );

    if (!settings.length || settings[0].setting_value !== 'true') {
      return sendError(res, 403, 'Razorpay is not enabled', 'RAZORPAY_DISABLED');
    }

    // Get booking details
    const [bookings] = await pool.execute(
      `SELECT b.id, b.booking_reference, b.total_price, b.customer_id, c.name, c.email, c.phone_number
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.id = ? AND b.customer_id = ?`,
      [booking_id, req.user.id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    const booking = bookings[0];

    // Initialize Razorpay
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: Math.round(booking.total_price * 100), // Amount in paise
      currency: 'INR',
      receipt: booking.booking_reference,
      notes: {
        booking_id: booking.id,
        customer_name: booking.name,
        customer_email: booking.email
      }
    });

    // Store order info
    await pool.execute(
      `INSERT INTO payments (booking_id, customer_id, payment_gateway, gateway_order_id, 
                            amount, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [booking.id, booking.customer_id, 'razorpay', order.id, booking.total_price, 'upi', 'pending']
    );

    return sendSuccess(res, {
      order_id: order.id,
      amount: booking.total_price,
      currency: 'INR',
      customer_name: booking.name,
      customer_email: booking.email,
      customer_phone: booking.phone_number
    }, 'Razorpay order created successfully');

  } catch (error) {
    console.error('Razorpay create order error:', error);
    return sendError(res, 500, 'Server error creating order', 'SERVER_ERROR');
  }
});

/**
 * POST /api/payment/razorpay/verify
 * Verify Razorpay payment
 * Required: order_id, payment_id, signature, booking_id
 */
router.post('/razorpay/verify', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { order_id, payment_id, signature, booking_id } = req.body;

    if (!order_id || !payment_id || !signature || !booking_id) {
      return sendError(res, 400, 'Missing required fields', 'MISSING_FIELDS');
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return sendError(res, 403, 'Payment verification failed', 'INVALID_SIGNATURE');
    }

    // Get booking
    const [bookings] = await pool.execute(
      'SELECT id, status FROM bookings WHERE id = ? AND customer_id = ?',
      [booking_id, req.user.id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    // Update payment record
    await pool.execute(
      `UPDATE payments SET payment_id = ?, payment_status = ?, payment_date = NOW() 
       WHERE booking_id = ? AND gateway_order_id = ?`,
      [payment_id, 'completed', booking_id, order_id]
    );

    // Update booking status to confirmed
    const oldStatus = bookings[0].status;
    await pool.execute('UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?', ['confirmed', booking_id]);

    // Add to booking status history
    await pool.execute(
      'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_type, notes) VALUES (?, ?, ?, ?, ?)',
      [booking_id, oldStatus, 'confirmed', 'system', 'Payment verified and booking confirmed']
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['customer', req.user.id, 'payment_verified', 'payment', booking_id, JSON.stringify({ gateway: 'razorpay', payment_id })]
    );

    return sendSuccess(res, { booking_id, status: 'confirmed' }, 'Payment verified successfully');

  } catch (error) {
    console.error('Razorpay verify error:', error);
    return sendError(res, 500, 'Server error verifying payment', 'SERVER_ERROR');
  }
});

/**
 * POST /api/payment/razorpay/webhook
 * Razorpay webhook for payment status updates
 */
router.post('/razorpay/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(req.body));
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== req.headers['x-razorpay-signature']) {
      return sendError(res, 403, 'Invalid webhook signature', 'INVALID_SIGNATURE');
    }

    // Log webhook
    await pool.execute(
      'INSERT INTO webhook_logs (gateway, event_type, payload, status) VALUES (?, ?, ?, ?)',
      ['razorpay', event, JSON.stringify(payload), 'processed']
    );

    // Handle payment events
    if (event === 'payment.authorized' || event === 'payment.captured') {
      const payment = payload.payment;
      
      // Find and update payment record
      await pool.execute(
        `UPDATE payments SET payment_status = 'completed' 
         WHERE payment_id = ?`,
        [payment.id]
      );

      // Find booking and update status
      const [payments] = await pool.execute(
        'SELECT booking_id FROM payments WHERE payment_id = ?',
        [payment.id]
      );

      if (payments.length > 0) {
        const bookingId = payments[0].booking_id;
        await pool.execute(
          'UPDATE bookings SET status = ? WHERE id = ?',
          ['confirmed', bookingId]
        );
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payment;
      
      await pool.execute(
        `UPDATE payments SET payment_status = 'failed' 
         WHERE payment_id = ?`,
        [payment.id]
      );
    }

    return sendSuccess(res, { event }, 'Webhook processed successfully');

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return sendError(res, 500, 'Server error processing webhook', 'SERVER_ERROR');
  }
});

// ============================================================
// 2. STRIPE - CREATE PAYMENT INTENT
// ============================================================

/**
 * POST /api/payment/stripe/create-intent
 * Create Stripe payment intent
 * Required: booking_id
 */
router.post('/stripe/create-intent', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return sendError(res, 400, 'Booking ID is required', 'MISSING_FIELD');
    }

    // Check if Stripe is enabled
    const [settings] = await pool.execute(
      'SELECT setting_value FROM website_settings WHERE setting_key = ?',
      ['stripe_enabled']
    );

    if (!settings.length || settings[0].setting_value !== 'true') {
      return sendError(res, 403, 'Stripe is not enabled', 'STRIPE_DISABLED');
    }

    // Get booking details
    const [bookings] = await pool.execute(
      `SELECT b.id, b.booking_reference, b.total_price, b.customer_id, c.name, c.email, c.phone_number
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.id = ? AND b.customer_id = ?`,
      [booking_id, req.user.id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    const booking = bookings[0];

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Create payment intent
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_price * 100), // Amount in cents
      currency: 'inr',
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        customer_name: booking.name
      },
      receipt_email: booking.email
    });

    // Store payment intent info
    await pool.execute(
      `INSERT INTO payments (booking_id, customer_id, payment_gateway, gateway_order_id, 
                            amount, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [booking.id, booking.customer_id, 'stripe', intent.id, booking.total_price, 'card', 'pending']
    );

    return sendSuccess(res, {
      client_secret: intent.client_secret,
      intent_id: intent.id,
      amount: booking.total_price,
      currency: 'inr',
      customer_name: booking.name
    }, 'Stripe payment intent created successfully');

  } catch (error) {
    console.error('Stripe create intent error:', error);
    return sendError(res, 500, 'Server error creating payment intent', 'SERVER_ERROR');
  }
});

/**
 * POST /api/payment/stripe/webhook
 * Stripe webhook for payment status updates
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Log webhook
    await pool.execute(
      'INSERT INTO webhook_logs (gateway, event_type, payload, status) VALUES (?, ?, ?, ?)',
      ['stripe', event.type, JSON.stringify(event.data.object), 'processed']
    );

    // Handle payment events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Update payment record
      await pool.execute(
        `UPDATE payments SET payment_status = 'completed', payment_id = ?, payment_date = NOW()
         WHERE gateway_order_id = ?`,
        [paymentIntent.id, paymentIntent.id]
      );

      // Find booking and update status
      const [payments] = await pool.execute(
        'SELECT booking_id FROM payments WHERE gateway_order_id = ?',
        [paymentIntent.id]
      );

      if (payments.length > 0) {
        const bookingId = payments[0].booking_id;
        
        // Get current booking status
        const [bookings] = await pool.execute(
          'SELECT status FROM bookings WHERE id = ?',
          [bookingId]
        );

        if (bookings.length > 0) {
          const oldStatus = bookings[0].status;
          
          // Update booking to confirmed
          await pool.execute(
            'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
            ['confirmed', bookingId]
          );

          // Add to status history
          await pool.execute(
            'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_type, notes) VALUES (?, ?, ?, ?, ?)',
            [bookingId, oldStatus, 'confirmed', 'system', 'Payment confirmed via Stripe webhook']
          );
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;

      await pool.execute(
        `UPDATE payments SET payment_status = 'failed'
         WHERE gateway_order_id = ?`,
        [paymentIntent.id]
      );
    }

    return sendSuccess(res, { event: event.type }, 'Webhook processed successfully');

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return sendError(res, 500, 'Server error processing webhook', 'SERVER_ERROR');
  }
});

/**
 * GET /api/payment/status/:booking_id
 * Get payment status for booking
 */
router.get('/status/:booking_id', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;

    const [payments] = await pool.execute(
      `SELECT id, payment_gateway, amount, payment_status, payment_date, payment_method
       FROM payments
       WHERE booking_id = ?`,
      [booking_id]
    );

    if (payments.length === 0) {
      return sendSuccess(res, null, 'No payment found for this booking');
    }

    return sendSuccess(res, payments[0], 'Payment status retrieved successfully');
  } catch (error) {
    console.error('Get payment status error:', error);
    return sendError(res, 500, 'Server error retrieving payment status', 'SERVER_ERROR');
  }
});

module.exports = router;
