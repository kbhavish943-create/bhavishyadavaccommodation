const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Import routes
const contacts = require('./routes/contacts');
const auth = require('./routes/auth');
const hotels = require('./routes/hotels');
const rooms = require('./routes/rooms');
const bookings = require('./routes/bookings');
const payments = require('./routes/payments');
const admin = require('./routes/admin');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api', contacts);
app.use('/api', auth);
app.use('/api', hotels);
app.use('/api', rooms);
app.use('/api', bookings);
app.use('/api', payments);
app.use('/api', admin);

// Razorpay: Create Order
app.post('/api/razorpay/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount, // in paise for INR
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    });
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Razorpay: Verify Payment
app.post('/api/razorpay/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Razorpay: Webhook endpoint
app.post('/api/razorpay/webhook', (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    if (expected === signature) {
      const event = req.body.event;
      console.log(`Webhook event: ${event}`, req.body);
      res.status(200).json({ received: true });
    } else {
      res.status(400).json({ error: 'Invalid webhook signature' });
    }
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
