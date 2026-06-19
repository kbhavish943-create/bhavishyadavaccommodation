// pages/checkout.tsx
import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, createPaymentIntent } from '../lib/stripe';

const stripePromise = getStripe();

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setStatus('');

    try {
      const { clientSecret } = await createPaymentIntent(5000); // $50.00

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (result.paymentIntent?.status === 'succeeded') {
        setStatus('✓ Payment successful!');
      } else {
        setStatus('✗ Payment failed: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err: any) {
      setStatus('✗ ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <CardElement />
      <button disabled={loading} type="submit" className="btn primary w-full">
        {loading ? 'Processing...' : 'Pay $50'}
      </button>
      {status && <div className={status.startsWith('✓') ? 'text-green-300' : 'text-red-400'}>{status}</div>}
    </form>
  );
}

export default function Checkout() {
  return (
    <div className="py-20">
      <div className="container max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
}
