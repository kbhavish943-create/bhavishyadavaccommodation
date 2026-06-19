import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(0);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate phone number
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/customer/request-otp`,
        { phone_number: phone }
      );

      setSuccess('OTP sent successfully!');
      setOtpExpiry(response.data.data.otp_expiry_seconds || 600);
      setStep('otp');

      // Start countdown timer
      let remaining = response.data.data.otp_expiry_seconds || 600;
      const timer = setInterval(() => {
        remaining--;
        setOtpExpiry(remaining);
        if (remaining <= 0) clearInterval(timer);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/customer/verify-otp`,
        { phone_number: phone, otp_code: otp }
      );

      // Store tokens and user info
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      localStorage.setItem('userRole', 'customer');

      // Redirect to dashboard
      router.push('/dashboard/customer');
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-center text-white">
            <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Customer Login</h1>
            <p className="text-purple-100 mt-2">OTP-Based Secure Access</p>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Progress Indicator */}
            <div className="flex gap-2 mb-8">
              <div className={`flex-1 h-2 rounded-full ${step === 'phone' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
              <div className={`flex-1 h-2 rounded-full ${step === 'otp' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            </div>

            {/* Step 1: Request OTP */}
            {step === 'phone' && (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                {/* Info Box */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <span className="font-semibold">No password needed!</span> We'll send you an OTP via SMS.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Phone Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-600">+</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError('');
                      }}
                      placeholder="1 (555) 000-0000 or +919876543210"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Include country code (e.g., +1 for US, +91 for India)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900">
                    OTP sent to <span className="font-semibold">{phone}</span>
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Expires in <span className="font-bold">{Math.floor(otpExpiry / 60)}:{String(otpExpiry % 60).padStart(2, '0')}</span> seconds
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    6-digit code sent to your phone
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Login'}
                </button>

                {/* Change Phone */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full p-3 border-2 border-purple-300 text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-all"
                >
                  Change Phone Number
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Other Options</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <Link href="/auth/developer-login">
                <button className="w-full p-3 border-2 border-blue-300 text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all text-sm">
                  Developer Login
                </button>
              </Link>
              <Link href="/auth/manager-login">
                <button className="w-full p-3 border-2 border-green-300 text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-all text-sm">
                  Manager Login
                </button>
              </Link>
            </div>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <Link href="/">
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  ← Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Helper Info */}
        <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-900 text-sm mb-2">🛎️ Customer Features</h4>
          <ul className="text-xs text-purple-800 space-y-1">
            <li>✓ Browse visible hotels only</li>
            <li>✓ Check real-time room availability</li>
            <li>✓ Make secure bookings</li>
            <li>✓ Pay online (Razorpay/Stripe)</li>
            <li>✓ View booking status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
