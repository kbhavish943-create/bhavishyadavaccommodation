import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentMethod = 'razorpay' | 'stripe' | 'upi' | 'card';

export default function Payment() {
  const [amount, setAmount] = useState(15000); // ₹150 in paise
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('razorpay');

  const handlePayment = async () => {
    setLoading(true);
    setStatus('');

    if (selectedPayment === 'razorpay') {
      handleRazorpayPayment();
    } else if (selectedPayment === 'stripe') {
      handleStripePayment();
    } else if (selectedPayment === 'upi') {
      setStatus('✓ UPI payment: Feature coming soon!');
      setLoading(false);
    } else if (selectedPayment === 'card') {
      handleStripePayment();
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      // Step 1: Create order from backend
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
  
      if (!orderResponse.ok) throw new Error('Failed to create order');
      const { order_id } = await orderResponse.json();
  
      // Step 2: Load Razorpay SDK
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
  
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZOR_KEY_ID,
          amount: amount,
          currency: 'INR',
          order_id: order_id,
          handler: async (response: any) => {
            // Step 3: Verify payment on backend
            try {
              const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
  
              const result = await verifyResponse.json();
              if (result.status !== 'success') {
                throw new Error(result.message || 'Payment failed');
              }
              setStatus(`✓ Payment successful! Transaction ID: ${result.transaction_id}`);
            } catch (err: any) {
              setStatus(`✗ Verification error: ${err.message}`);
            }
            setLoading(false);
          },
          prefill: {
            name: 'Customer Name',
            email: 'customer@example.com',
            contact: '9999999999'
          },
          theme: {
            color: '#00ffff'
          }
        };
  
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setStatus(`✗ Payment failed: ${response.error.description}`);
          setLoading(false);
        });
        rzp.open();
      };
    } catch (err: any) {
      setStatus(`✗ Error: ${err.message}`);
      setLoading(false);
    }
  };
  const handleStripePayment = async () => {
    try {
      const stripeAmount = Math.round((amount / 100) * 100); // Convert paise to cents
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: stripeAmount, currency: 'usd' })
      });

      if (!response.ok) throw new Error('Failed to create payment intent');
      
      setStatus('✓ Stripe integration available. Payment intent created.');
      setLoading(false);
    } catch (err: any) {
      setStatus(`✗ Stripe Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-2">
            Payment Gateway
          </h1>
          <p className="text-gray-300">Choose your preferred payment method</p>
        </div>

        {/* Main Payment Card */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-cyan-500">
          
          {/* Amount Section */}
          <div className="mb-8 p-6 bg-gray-700 rounded-lg border border-gray-600">
            <label className="block text-white mb-2 font-semibold">Amount (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount / 100}
                onChange={(e: any) => setAmount(parseInt(e.target.value) * 100)}
                className="flex-1 bg-gray-600 text-white px-4 py-3 rounded border border-gray-500 focus:outline-none focus:border-cyan-500"
                placeholder="150"
              />
              <div className="bg-gray-600 px-4 py-3 rounded border border-gray-500 text-white flex items-center font-semibold">
                INR
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Paise: {amount} (₹{amount / 100})
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <label className="block text-white mb-4 font-semibold">Payment Method</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Razorpay */}
              <button
                onClick={() => setSelectedPayment('razorpay')}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedPayment === 'razorpay'
                    ? 'border-cyan-500 bg-cyan-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">💳</div>
                <div className="text-white font-semibold text-sm">Razorpay</div>
                <div className="text-gray-400 text-xs">Cards & Wallets</div>
              </button>

              {/* Stripe */}
              <button
                onClick={() => setSelectedPayment('stripe')}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedPayment === 'stripe'
                    ? 'border-cyan-500 bg-cyan-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="text-white font-semibold text-sm">Stripe</div>
                <div className="text-gray-400 text-xs">Global Cards</div>
              </button>

              {/* UPI */}
              <button
                onClick={() => setSelectedPayment('upi')}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedPayment === 'upi'
                    ? 'border-cyan-500 bg-cyan-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">📱</div>
                <div className="text-white font-semibold text-sm">UPI</div>
                <div className="text-gray-400 text-xs">Coming Soon</div>
              </button>

              {/* Net Banking */}
              <button
                onClick={() => setSelectedPayment('card')}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedPayment === 'card'
                    ? 'border-cyan-500 bg-cyan-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">🏦</div>
                <div className="text-white font-semibold text-sm">Debit Card</div>
                <div className="text-gray-400 text-xs">All Banks</div>
              </button>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8 p-4 bg-gray-700 rounded border border-gray-600">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Amount:</span>
              <span className="text-white font-semibold">₹{amount / 100}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Payment Method:</span>
              <span className="text-cyan-400 font-semibold capitalize">{selectedPayment}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition duration-300 text-lg mb-4"
          >
            {loading ? '⏳ Processing...' : `Pay ₹${amount / 100} with ${selectedPayment.toUpperCase()}`}
          </button>

          {/* Status Message */}
          {status && (
            <div
              className={`p-4 rounded-lg text-center font-semibold border ${
                status.startsWith('✓')
                  ? 'bg-green-900/30 text-green-300 border-green-500'
                  : 'bg-red-900/30 text-red-300 border-red-500'
              }`}
            >
              {status}
            </div>
          )}
        </div>

        {/* Test Cards Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPayment === 'razorpay' && (
            <div className="p-4 bg-gray-800 rounded border border-gray-600">
              <p className="font-semibold text-cyan-400 mb-3">🧪 Test Card (Razorpay)</p>
              <p className="text-gray-300 text-sm">Card: 4111 1111 1111 1111</p>
              <p className="text-gray-300 text-sm">Expiry: Any future date</p>
              <p className="text-gray-300 text-sm">CVV: Any 3 digits</p>
            </div>
          )}

          {selectedPayment === 'stripe' && (
            <div className="p-4 bg-gray-800 rounded border border-gray-600">
              <p className="font-semibold text-cyan-400 mb-3">🧪 Test Card (Stripe)</p>
              <p className="text-gray-300 text-sm">Card: 4242 4242 4242 4242</p>
              <p className="text-gray-300 text-sm">Expiry: Any future date</p>
              <p className="text-gray-300 text-sm">CVV: Any 3 digits</p>
            </div>
          )}

          <div className="p-4 bg-gray-800 rounded border border-gray-600">
            <p className="font-semibold text-pink-400 mb-3">💡 Features</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>✓ Secure Payment Processing</li>
              <li>✓ Multiple Payment Methods</li>
              <li>✓ Instant Verification</li>
              <li>✓ 24/7 Customer Support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
