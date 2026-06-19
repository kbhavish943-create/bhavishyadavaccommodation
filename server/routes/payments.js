const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ==================== CUSTOMER: CREATE PAYMENT (MOCK) ====================
router.post('/customer/payments/create', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { bookingId, amount, currency = 'INR', paymentMethod = 'card' } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: 'bookingId and amount are required' 
    });
  }

  try {
    const connection = await pool.getConnection();

    // Get booking details
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND customer_id = ?',
      [bookingId, req.user.userId]
    );

    if (bookings.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    // Verify amount
    if (amount !== booking.total_price) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        error: 'Amount mismatch' 
      });
    }

    // Generate mock payment ID
    const mockPaymentId = `PAY${Date.now()}`;

    // Update booking with payment info
    await connection.query(
      'UPDATE bookings SET payment_status = ?, payment_method = ?, payment_id = ? WHERE booking_id = ?',
      ['paid', paymentMethod, mockPaymentId, bookingId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: mockPaymentId,
        bookingId,
        amount,
        currency,
        status: 'success',
        paymentMethod
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: GET PAYMENT STATUS ====================
router.get('/customer/payments/:paymentId/status', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { paymentId } = req.params;

  try {
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      'SELECT id, booking_id, payment_id, payment_status, total_price FROM bookings WHERE payment_id = ? AND customer_id = ?',
      [paymentId, req.user.userId]
    );

    connection.release();

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    const booking = bookings[0];

    res.json({
      success: true,
      data: {
        paymentId,
        bookingId: booking.booking_id,
        status: booking.payment_status,
        amount: booking.total_price
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: VERIFY PAYMENT (MOCK) ====================
router.post('/customer/payments/verify', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { bookingId, paymentId } = req.body;

  if (!bookingId || !paymentId) {
    return res.status(400).json({ 
      success: false, 
      error: 'bookingId and paymentId are required' 
    });
  }

  try {
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND customer_id = ? AND payment_id = ?',
      [bookingId, req.user.userId, paymentId]
    );

    connection.release();

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking or payment not found' 
      });
    }

    const booking = bookings[0];

    // Check if payment is confirmed
    if (booking.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment not confirmed' 
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bookingId,
        paymentId,
        verified: true,
        status: booking.payment_status
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MOCK: RAZORPAY PAYMENT ====================
router.post('/customer/payments/razorpay/create-order', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: 'bookingId and amount are required' 
    });
  }

  try {
    // Mock Razorpay order
    const mockOrderId = `order_${Date.now()}`;
    
    res.json({
      success: true,
      orderId: mockOrderId,
      amount,
      currency: 'INR',
      bookingId,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
      message: '[MOCK] Use this order_id in Razorpay payment modal'
    });

  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MOCK: STRIPE PAYMENT ====================
router.post('/customer/payments/stripe/create-session', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: 'bookingId and amount are required' 
    });
  }

  try {
    // Mock Stripe session
    const mockSessionId = `cs_${Date.now()}`;
    
    res.json({
      success: true,
      sessionId: mockSessionId,
      amount,
      currency: 'INR',
      bookingId,
      publishableKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_mock_key',
      message: '[MOCK] Use this session_id for Stripe payment processing'
    });

  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: GET HOTEL PAYMENTS ====================
router.get('/manager/payments', authenticateToken, authorizeRole('manager'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get manager's hotel
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    if (managers.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'No hotel assigned' 
      });
    }

    const hotelId = managers[0].hotel_id;

    const [payments] = await connection.query(
      `SELECT b.booking_id, b.total_price as amount, b.payment_status as status, 
              b.payment_method as method, b.created_at, c.phone_number as customer
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.hotel_id = ? AND b.payment_status = 'paid'
       ORDER BY b.created_at DESC`,
      [hotelId]
    );

    connection.release();

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      totalRevenue,
      totalTransactions: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
