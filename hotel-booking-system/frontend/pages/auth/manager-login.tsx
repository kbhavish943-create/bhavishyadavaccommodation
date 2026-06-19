import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ManagerLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ manager_id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/manager/login`, formData);
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      localStorage.setItem('userRole', 'manager');

      // Redirect to dashboard
      router.push('/dashboard/manager');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials and ensure you are approved by the developer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 p-8 text-center text-white">
            <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Manager Login</h1>
            <p className="text-green-100 mt-2">Hotel Management Portal</p>
          </div>

          {/* Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Warning Message */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Note:</span> Your account must be approved by a Developer before you can log in.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Manager ID Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Manager ID
                </label>
                <input
                  type="text"
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  placeholder="e.g., MGR001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provided by developer after approval
                </p>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all"
              >
                {loading ? 'Logging in...' : 'Login as Manager'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Other Options</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <Link href="/auth/developer-login">
                <button className="w-full p-3 border-2 border-blue-300 text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all">
                  Developer Login
                </button>
              </Link>
              <Link href="/auth/customer-login">
                <button className="w-full p-3 border-2 border-purple-300 text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-all">
                  Customer Login
                </button>
              </Link>
            </div>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <Link href="/">
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  ← Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Helper Info */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 text-sm mb-2">🏨 Manager Features</h4>
          <ul className="text-xs text-green-800 space-y-1">
            <li>✓ Manage hotel details</li>
            <li>✓ Create and manage rooms</li>
            <li>✓ Set dynamic pricing</li>
            <li>✓ View hotel bookings</li>
            <li>✓ Toggle visibility to customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
