// lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

let stripePromise: any;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export async function createPaymentIntent(amount: number, metadata?: any) {
  const API_BASE = (typeof window !== 'undefined' && (window as any).API_BASE) || 'http://localhost:3000';
  
  const res = await fetch(`${API_BASE}/api/payment/create-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'usd', metadata })
  });

  if (!res.ok) throw new Error('Failed to create payment intent');
  return res.json();
}
