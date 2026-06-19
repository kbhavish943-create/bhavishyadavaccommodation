// src/controllers/paymentController.js
// Payment Gateway Integration (Razorpay + Stripe)
// Week 2: Payment Processing with Atomic Locking

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Availability = require('../models/Availability');
const logger = require('../config/logger');

// Initialize payment gateways
const Razorpay = require('razorpay');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * ============================================
 * RAZORPAY: CREATE ORDER ENDPOINT
 * ============================================
 * 
 * POST /api/payments/razorpay/create-order
 * 
 * Purpose:
 *   1. Validate booking exists and status is 'pending'
 *   2. Verify availability lock is still active (not expired)
 *   3. Create Razorpay order for payment
 *   4. Store orderId in booking document
 *   5. Return orderId + Razorpay public key to frontend
 * 
 * Flow:
 *   Frontend → POST /create-order {bookingId, amount}
 *             ↓
 *         Validate booking + lock active
 *             ↓
 *         Create Razorpay order
 *             ↓
 *         Save orderId to booking
 *             ↓
 *         Return {orderId, keyId, amount}
 *             ↓
 *         Frontend opens Razorpay modal
 */
exports.createRazorpayOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, amount } = req.body;

    // ========================================
    // STEP 1: VALIDATE INPUT
    // ========================================
    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'bookingId and amount are required'
      });
    }

    // ========================================
    // STEP 2: FETCH BOOKING WITH LOCK VALIDATION
    // ========================================
    const booking = await Booking.findById(bookingId).session(session);
    
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Validate booking is in 'pending' state
    if (booking.payment.status !== 'pending') {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: `Booking payment status is ${booking.payment.status}, expected 'pending'`,
        status: booking.payment.status
      });
    }

    // ========================================
    // STEP 3: VERIFY AVAILABILITY LOCK IS ACTIVE
    // ========================================
    const availability = await Availability.findOne({
      hallId: booking.hallId,
      date: {
        $gte: new Date(booking.eventDate).setHours(0, 0, 0, 0),
        $lt: new Date(booking.eventDate).setHours(23, 59, 59, 999)
      }
    }).session(session);

    if (!availability) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Availability record not found. Lock may have expired.',
        lockExpired: true
      });
    }

    // Check lock is active
    if (availability.status !== 'locked') {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: `Availability status is ${availability.status}, expected 'locked'`,
        status: availability.status,
        lockExpired: availability.status === 'unlocked'
      });
    }

    // Check lock has not expired
    if (availability.lockedUntil < new Date()) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Availability lock has expired. Please create a new booking.',
        lockExpired: true
      });
    }

    // ========================================
    // STEP 4: VALIDATE AMOUNT MATCHES BOOKING
    // ========================================
    if (Math.abs(amount - booking.pricing.totalAmount) > 1) { // Allow 1 rupee variance
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Amount mismatch',
        expected: booking.pricing.totalAmount,
        received: amount
      });
    }

    // ========================================
    // STEP 5: CREATE RAZORPAY ORDER
    // ========================================
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise (₹1 = 100 paise)
        currency: 'INR',
        receipt: `booking_${bookingId}_${Date.now()}`,
        notes: {
          bookingId: bookingId.toString(),
          hallId: booking.hallId.toString(),
          customerId: booking.customerId.toString(),
          eventDate: booking.eventDate.toISOString()
        }
      });
    } catch (paymentError) {
      logger.error('Razorpay order creation failed:', paymentError);
      await session.abortTransaction();
      return res.status(502).json({
        success: false,
        error: 'Failed to create payment order',
        details: paymentError.message
      });
    }

    // ========================================
    // STEP 6: STORE RAZORPAY ORDER ID IN BOOKING
    // ========================================
    booking.payment.orderId = razorpayOrder.id;
    await booking.save({ session });

    // ========================================
    // STEP 7: LOG PAYMENT INITIATION
    // ========================================
    const payment = new Payment({
      bookingId: booking._id,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
      hallId: booking.hallId,
      amount: amount,
      currency: 'INR',
      paymentType: 'full',
      gateway: 'razorpay',
      razorpay: {
        orderId: razorpayOrder.id
      },
      status: 'initiated',
      notes: {
        source: 'create-order endpoint',
        timestamp: new Date()
      }
    });

    await payment.save({ session });

    await session.commitTransaction();

    // ========================================
    // STEP 8: RETURN RESPONSE TO FRONTEND
    // ========================================
    logger.info(`✅ Razorpay order created: ${razorpayOrder.id} for booking ${bookingId}`);

    res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        bookingId: bookingId,
        prefill: {
          name: booking.customerId.name || 'Customer',
          email: booking.customerId.email || '',
          contact: booking.customerId.phone || ''
        },
        notes: {
          bookingId: bookingId,
          eventDate: booking.eventDate
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      details: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================
 * RAZORPAY: WEBHOOK HANDLER
 * ============================================
 * 
 * POST /api/payments/razorpay/webhook
 * 
 * Purpose:
 *   1. Verify Razorpay webhook signature (CRITICAL SECURITY)
 *   2. Extract bookingId from notes
 *   3. Update booking status to 'confirmed'
 *   4. Update availability to 'booked' (permanent lock)
 *   5. Log payment confirmation
 * 
 * Security:
 *   - HMAC-SHA256 signature verification
 *   - Must verify before any database writes
 * 
 * Webhook Events Handled:
 *   - payment.authorized (payment successful)
 *   - payment.failed (payment failed)
 *   - payment.captured (amount captured)
 */
exports.razorpayWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ========================================
    // STEP 1: VERIFY WEBHOOK SIGNATURE
    // ========================================
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      logger.warn('Webhook signature or secret missing');
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Webhook signature or secret missing'
      });
    }

    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      logger.warn('Webhook signature verification failed');
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        error: 'Webhook signature verification failed'
      });
    }

    logger.info('✅ Webhook signature verified');

    // ========================================
    // STEP 2: EXTRACT WEBHOOK DATA
    // ========================================
    const { event, payload } = req.body;
    const razorpayPayment = payload.payment.entity;

    logger.info(`Processing webhook event: ${event}`);

    // Handle different Razorpay events
    if (event === 'payment.authorized' || event === 'payment.captured') {
      // ========================================
      // STEP 3: FETCH BOOKING FROM ORDER NOTES
      // ========================================
      const bookingId = razorpayPayment.notes?.bookingId;

      if (!bookingId) {
        logger.error('Webhook: bookingId not found in payment notes', razorpayPayment);
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: 'Booking ID not found in payment notes'
        });
      }

      // ========================================
      // STEP 4: VERIFY RAZORPAY PAYMENT SIGNATURE
      // ========================================
      const orderId = razorpayPayment.order_id;
      const paymentId = razorpayPayment.id;
      const amount = razorpayPayment.amount;

      // Note: Razorpay webhook already verified at Step 1
      // Additional verification for data integrity
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        logger.error(`Webhook: Booking ${bookingId} not found`);
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Verify amount matches
      if (Math.abs(amount / 100 - booking.pricing.totalAmount) > 1) {
        logger.error(`Webhook: Amount mismatch for booking ${bookingId}`, {
          expected: booking.pricing.totalAmount,
          received: amount / 100
        });
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: 'Payment amount mismatch'
        });
      }

      // ========================================
      // STEP 5: UPDATE BOOKING STATUS
      // ========================================
      booking.payment.status = 'completed';
      booking.payment.transactionId = paymentId;
      booking.payment.paymentDate = new Date();
      booking.payment.paidAmount = amount / 100;
      booking.status = 'confirmed';

      await booking.save({ session });

      // ========================================
      // STEP 6: MARK AVAILABILITY AS BOOKED (PERMANENT)
      // ========================================
      const availability = await Availability.findOneAndUpdate(
        {
          hallId: booking.hallId,
          date: {
            $gte: new Date(booking.eventDate).setHours(0, 0, 0, 0),
            $lt: new Date(booking.eventDate).setHours(23, 59, 59, 999)
          }
        },
        {
          status: 'booked',
          bookingId: booking._id,
          lockedUntil: null // Remove TTL once booked
        },
        { session, new: true }
      );

      if (!availability) {
        logger.error(`Webhook: Availability not found for hall ${booking.hallId}`);
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Availability record not found'
        });
      }

      // ========================================
      // STEP 7: LOG PAYMENT IN PAYMENT COLLECTION
      // ========================================
      await Payment.findOneAndUpdate(
        { 'razorpay.orderId': orderId },
        {
          'razorpay.paymentId': paymentId,
          'razorpay.signatureValid': true,
          status: 'completed',
          transactionId: paymentId,
          successDate: new Date()
        },
        { session }
      );

      await session.commitTransaction();

      logger.info(`✅ Payment webhook processed for booking ${bookingId}`);
      logger.info(`✅ Booking ${bookingId} confirmed`);
      logger.info(`✅ Availability for hall ${booking.hallId} marked as BOOKED`);

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        bookingId: bookingId,
        paymentId: paymentId
      });

    } else if (event === 'payment.failed') {
      // ========================================
      // HANDLE PAYMENT FAILURE
      // ========================================
      const bookingId = razorpayPayment.notes?.bookingId;

      if (!bookingId) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: 'Booking ID not found in failed payment notes'
        });
      }

      const booking = await Booking.findById(bookingId).session(session);

      if (booking) {
        booking.payment.status = 'failed';
        booking.payment.failureReason = razorpayPayment.error_reason || 'Unknown error';
        await booking.save({ session });

        // Availability will auto-unlock via TTL (15 minutes)
        logger.info(`Payment failed for booking ${bookingId}, availability will auto-unlock`);
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Payment failure processed',
        bookingId: bookingId
      });

    } else {
      // Unhandled event
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: `Unhandled webhook event: ${event}`
      });
    }

  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      logger.error('Transaction abort error:', abortError);
    }
    logger.error('Razorpay webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================
 * STRIPE: CREATE PAYMENT INTENT ENDPOINT
 * ============================================
 * 
 * POST /api/payments/stripe/create-intent
 */
exports.createStripePaymentIntent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'bookingId and amount are required'
      });
    }

    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.payment.status !== 'pending') {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: `Booking payment status is ${booking.payment.status}`
      });
    }

    // Verify availability lock is active
    const availability = await Availability.findOne({
      hallId: booking.hallId,
      date: {
        $gte: new Date(booking.eventDate).setHours(0, 0, 0, 0),
        $lt: new Date(booking.eventDate).setHours(23, 59, 59, 999)
      },
      status: 'locked',
      lockedUntil: { $gt: new Date() }
    }).session(session);

    if (!availability) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Availability lock expired or not found',
        lockExpired: true
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'inr',
      metadata: {
        bookingId: bookingId.toString(),
        hallId: booking.hallId.toString(),
        eventDate: booking.eventDate.toISOString()
      }
    });

    // Store client secret in booking
    booking.payment.orderId = paymentIntent.id;
    await booking.save({ session });

    // Log payment initiation
    const payment = new Payment({
      bookingId: booking._id,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
      hallId: booking.hallId,
      amount: amount,
      currency: 'INR',
      paymentType: 'full',
      gateway: 'stripe',
      stripe: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      },
      status: 'initiated'
    });

    await payment.save({ session });
    await session.commitTransaction();

    logger.info(`✅ Stripe payment intent created: ${paymentIntent.id}`);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error('Create Stripe payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      details: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================
 * STRIPE: WEBHOOK HANDLER
 * ============================================
 */
exports.stripeWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, // Use raw body for signature verification
        sig,
        webhookSecret
      );
    } catch (err) {
      logger.warn('Stripe webhook signature verification failed:', err);
      await session.abortTransaction();
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    logger.info(`Processing Stripe event: ${event.type}`);

    const paymentIntent = event.data.object;

    if (event.type === 'payment_intent.succeeded') {
      const bookingId = paymentIntent.metadata?.bookingId;

      if (!bookingId) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'Booking ID not found in metadata' });
      }

      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Update booking
      booking.payment.status = 'completed';
      booking.payment.transactionId = paymentIntent.id;
      booking.payment.paymentDate = new Date();
      booking.payment.paidAmount = paymentIntent.amount / 100;
      booking.status = 'confirmed';

      await booking.save({ session });

      // Mark availability as booked
      await Availability.findOneAndUpdate(
        {
          hallId: booking.hallId,
          date: {
            $gte: new Date(booking.eventDate).setHours(0, 0, 0, 0),
            $lt: new Date(booking.eventDate).setHours(23, 59, 59, 999)
          }
        },
        {
          status: 'booked',
          bookingId: booking._id,
          lockedUntil: null
        },
        { session }
      );

      // Log payment
      await Payment.findOneAndUpdate(
        { 'stripe.paymentIntentId': paymentIntent.id },
        {
          status: 'completed',
          transactionId: paymentIntent.id,
          successDate: new Date()
        },
        { session }
      );

      await session.commitTransaction();

      logger.info(`✅ Stripe payment succeeded for booking ${bookingId}`);

      res.status(200).json({ received: true });

    } else if (event.type === 'payment_intent.payment_failed') {
      const bookingId = paymentIntent.metadata?.bookingId;

      if (bookingId) {
        const booking = await Booking.findById(bookingId).session(session);
        if (booking) {
          booking.payment.status = 'failed';
          booking.payment.failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
          await booking.save({ session });
        }
      }

      await session.commitTransaction();
      logger.info(`Stripe payment failed for intent ${paymentIntent.id}`);

      res.status(200).json({ received: true });

    } else {
      await session.abortTransaction();
      res.status(400).json({ error: `Unhandled event type: ${event.type}` });
    }

  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      logger.error('Transaction abort error:', abortError);
    }
    logger.error('Stripe webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================
 * GET PAYMENT STATUS ENDPOINT
 * ============================================
 * 
 * GET /api/payments/:bookingId/status
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const payment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        bookingId: bookingId,
        bookingStatus: booking.status,
        paymentStatus: booking.payment.status,
        amount: booking.pricing.totalAmount,
        paidAmount: booking.payment.paidAmount,
        transactionId: booking.payment.transactionId,
        paymentDate: booking.payment.paymentDate,
        paymentHistory: payment ? {
          gateway: payment.gateway,
          paymentType: payment.paymentType,
          createdAt: payment.createdAt
        } : null
      }
    });

  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment status',
      details: error.message
    });
  }
};
