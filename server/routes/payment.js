const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// POST /api/payment/create-intent
// Create a Stripe Payment Intent for frontend checkout
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    return res.status(500).json({ success: false, message: 'Payment failed' });
  }
});

// POST /api/payment/webhook
// Stripe webhook handler (configure in Stripe dashboard)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook sig error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('✓ Payment succeeded:', paymentIntent.id);
    // TODO: Save order to DB, send confirmation email, etc.
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log('✗ Payment failed:', paymentIntent.id);
  }

  res.json({received: true});
});

module.exports = router;
