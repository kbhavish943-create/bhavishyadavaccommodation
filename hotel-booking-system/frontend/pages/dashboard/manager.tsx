import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LogOut, Building2, DoorOpen, Toggle2 } from 'lucide-react';
import axios from 'axios';

interface Manager {
  manager_id: string;
  hotel_id: number;
  hotel_name?: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hotel' | 'rooms' | 'bookings' | 'settings'>('hotel');
  const [hotelVisible, setHotelVisible] = useState(true);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [paymentEnabled, setPaymentEnabled] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'manager') {
      router.push('/auth/manager-login');
      return;
    }

    // Get user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setManager(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-100">{manager?.manager_id}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-green-100 hover:text-white flex items-center gap-1 mt-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('hotel')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'hotel'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Hotel</span>
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'rooms'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <DoorOpen className="w-5 h-5" />
            <span>Rooms</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'bookings'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <Toggle2 className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Hotel Tab */}
        {activeTab === 'hotel' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Hotel Details</h2>
            <div className="bg-white rounded-lg shadow p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hotel Name</label>
                  <input
                    type="text"
                    defaultValue={manager?.hotel_name || 'My Hotel'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    defaultValue="New York"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    defaultValue="123 Main Street"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Rooms</label>
                  <input
                    type="text"
                    defaultValue="25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                </div>
              </div>
              <button className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all">
                Edit Hotel Details
              </button>
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Manage Rooms</h2>
              <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all">
                + Add Room
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(room => (
                <div key={room} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Room {room}</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">Double Bed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price/Night:</span>
                      <span className="font-semibold text-green-600">$99.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Available</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-green-50 text-green-600 font-semibold rounded hover:bg-green-100 transition-all">
                      Edit
                    </button>
                    <button className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded hover:bg-red-100 transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Hotel Bookings</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Guest Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Room</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Check-In</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(booking => (
                    <tr key={booking} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">John Doe</td>
                      <td className="px-6 py-4">Room {booking}</td>
                      <td className="px-6 py-4">2024-01-15</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          Confirmed
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-green-600 hover:text-green-800 font-semibold">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Hotel Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <label className="font-semibold text-gray-900">Show Hotel to Customers</label>
                  <p className="text-sm text-gray-600">Customers can only see your hotel if enabled</p>
                </div>
                <button
                  onClick={() => setHotelVisible(!hotelVisible)}
                  className={`relative w-12 h-6 rounded-full transition-all ${hotelVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${hotelVisible ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <label className="font-semibold text-gray-900">Enable Online Booking</label>
                  <p className="text-sm text-gray-600">Customers can make bookings online</p>
                </div>
                <button
                  onClick={() => setBookingEnabled(!bookingEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all ${bookingEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${bookingEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <label className="font-semibold text-gray-900">Enable Online Payment</label>
                  <p className="text-sm text-gray-600">Accept online payments (Razorpay/Stripe)</p>
                </div>
                <button
                  onClick={() => setPaymentEnabled(!paymentEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all ${paymentEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${paymentEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Home */}
      <div className="text-center py-8">
        <Link href="/">
          <button className="text-green-600 hover:text-green-800 font-medium">
            ← Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
