import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LogOut, Building2, Users, Settings, BarChart3, Lock } from 'lucide-react';
import axios from 'axios';

interface Developer {
  dev_id: string;
  email?: string;
}

interface Hotel {
  id: number;
  name: string;
  city: string;
  total_rooms: number;
  status: string;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hotels' | 'managers' | 'settings' | 'analytics'>('hotels');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'developer') {
      router.push('/auth/developer-login');
      return;
    }

    // Get user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setDeveloper(JSON.parse(userData));
    }

    // Fetch hotels
    fetchHotels(token);
  }, []);

  const fetchHotels = async (token: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/developer/hotels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotels(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch hotels', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">{developer?.dev_id}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-100 hover:text-white flex items-center gap-1 mt-1"
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
            onClick={() => setActiveTab('hotels')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'hotels'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Hotels</span>
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'managers'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Managers</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Hotels Tab */}
        {activeTab === 'hotels' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">All Hotels</h2>
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">
                + Add Hotel
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading hotels...</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hotels Yet</h3>
                <p className="text-gray-600 mb-6">Create your first hotel to get started</p>
                <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">
                  Create Hotel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map(hotel => (
                  <div key={hotel.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{hotel.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{hotel.city}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Total Rooms</p>
                        <p className="text-2xl font-bold text-blue-600">{hotel.total_rooms}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Status</p>
                        <p className="text-sm font-semibold text-green-600 capitalize">{hotel.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded hover:bg-blue-100 transition-all">
                        Edit
                      </button>
                      <button className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded hover:bg-red-100 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Managers Tab */}
        {activeTab === 'managers' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Manager Approvals</h2>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Manager approval requests will appear here</p>
              <p className="text-sm text-gray-500 mt-2">Currently, no pending requests</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Feature Settings</h2>
            <div className="space-y-4">
              {['Online Booking', 'Online Payment', 'Razorpay', 'Stripe', 'Email Notifications', 'SMS Notifications'].map(setting => (
                <div key={setting} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <label className="text-gray-900 font-semibold">{setting}</label>
                  <button className="relative w-12 h-6 bg-green-500 rounded-full transition-all shadow-inner">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">System Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Hotels', value: hotels.length, color: 'blue' },
                { label: 'Active Managers', value: 0, color: 'green' },
                { label: 'Total Bookings', value: 0, color: 'purple' },
                { label: 'Revenue', value: '$0', color: 'orange' }
              ].map(stat => (
                <div key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-6`}>
                  <p className={`text-sm text-${stat.color}-700 mb-2`}>{stat.label}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Back to Home */}
      <div className="text-center py-8">
        <Link href="/">
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
