import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LogOut, Search, MapPin, DoorOpen, Heart } from 'lucide-react';
import axios from 'axios';

interface Customer {
  customer_id: number;
  phone_number: string;
  name?: string;
}

interface Hotel {
  id: number;
  name: string;
  city: string;
  rating?: number;
  price_range?: string;
}

interface Booking {
  booking_id: string;
  hotel_id: number;
  room_id: number;
  hotel_name?: string;
  room_name?: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'profile'>('browse');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'customer') {
      router.push('/auth/customer-login');
      return;
    }

    // Get user data
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setCustomer(parsed);
      setNameInput(parsed.name || '');
    }

    // Fetch hotels
    fetchHotels(token);
  }, []);

  const fetchHotels = async (token: string, city?: string) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/customer/hotels${city ? `?city=${encodeURIComponent(city)}` : ''}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotels(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch hotels', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch bookings when user opens bookings tab
    const token = localStorage.getItem('accessToken');
    if (activeTab === 'bookings' && token) {
      fetchBookings(token);
    }
  }, [activeTab]);

  const fetchBookings = async (token: string) => {
    try {
      setBookingsLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleSearch = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setLoading(true);
    await fetchHotels(token, searchCity);
  };

  const handleViewBook = (hotel: Hotel) => {
    // Navigate to payment/booking flow with hotel preselected
    router.push(`/payment?hotelId=${hotel.id}`);
  };

  const cancelBooking = async (bookingId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (error) {
      console.error('Failed to cancel booking', error);
      alert('Failed to cancel booking');
    }
  };

  const saveProfile = async () => {
    // Local update; you can extend this to call API if endpoint exists
    const updated = { ...customer, name: nameInput } as Customer;
    setCustomer(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    alert('Profile saved locally');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.city.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Hotel Booking</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-100">{customer?.phone_number}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-purple-100 hover:text-white flex items-center gap-1 mt-1"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'browse'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Browse Hotels</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'bookings'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <DoorOpen className="w-5 h-5" />
            <span>My Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`p-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>

        {/* Browse Hotels Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Available Hotels</h2>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Search by City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="e.g., New York, Los Angeles"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
                  Search
                </button>
              </div>
            </div>

            {/* Hotels Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading hotels...</p>
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchCity ? 'No hotels found' : 'No hotels available'}
                </h3>
                <p className="text-gray-600">
                  {searchCity ? 'Try searching for a different city' : 'Browse all available hotels'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map(hotel => (
                  <div key={hotel.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center">
                      <DoorOpen className="w-12 h-12 text-purple-600 opacity-50" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{hotel.name}</h3>
                        <button className="text-red-500 hover:text-red-700 transition-all">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">{hotel.city}</p>
                      </div>

                      {hotel.rating && (
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-semibold text-gray-900">{hotel.rating}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-600 mb-3">
                          from <span className="font-bold text-purple-600 text-lg">{hotel.price_range || '$99'}</span>/night
                        </p>
                        <button className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
                          View & Book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">My Bookings</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-8 text-center">
                <DoorOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-600 mb-6">Start exploring hotels and make your first booking!</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all"
                >
                  Browse Hotels
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
            
            <div className="bg-white rounded-lg shadow p-8">
              <div className="max-w-md">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customer?.phone_number || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    defaultValue={customer?.name || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Home */}
      <div className="text-center py-8">
        <Link href="/">
          <button className="text-purple-600 hover:text-purple-800 font-medium">
            ← Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
