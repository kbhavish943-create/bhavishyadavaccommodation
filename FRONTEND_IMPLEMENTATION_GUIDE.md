# Multi-Service Platform - Frontend Implementation Guide

## 🎨 Frontend Components Architecture

### Directory Structure

```
frontend/
├── pages/
│   ├── index.tsx                 # Homepage with service categories
│   ├── search.tsx                # Search & filter results
│   ├── services/
│   │   └── [id].tsx              # Service detail page
│   ├── vendors/
│   │   └── [id].tsx              # Vendor profile page
│   ├── bookings/
│   │   ├── index.tsx             # Bookings list
│   │   ├── [id].tsx              # Booking details
│   │   ├── create.tsx            # Booking creation flow
│   │   └── success.tsx           # Booking success
│   ├── reviews/
│   │   └── create.tsx            # Add review
│   ├── account/
│   │   ├── profile.tsx           # User profile
│   │   ├── bookings.tsx          # My bookings
│   │   ├── favorites.tsx         # Wishlist
│   │   └── settings.tsx          # Account settings
│   ├── vendor/
│   │   ├── dashboard.tsx         # Vendor dashboard
│   │   ├── services.tsx          # Service management
│   │   ├── bookings.tsx          # Vendor's bookings
│   │   ├── availability.tsx      # Availability manager
│   │   ├── analytics.tsx         # Revenue & stats
│   │   └── payouts.tsx           # Payout history
│   ├── admin/
│   │   ├── dashboard.tsx         # Admin dashboard
│   │   ├── vendors.tsx           # Vendor management
│   │   ├── bookings.tsx          # All bookings
│   │   ├── disputes.tsx          # Dispute resolution
│   │   └── analytics.tsx         # Platform analytics
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── vendor-signup.tsx
│   │   └── forgot-password.tsx
│   └── _app.tsx                  # App wrapper
│
├── components/
│   ├── common/
│   │   ├── Header.tsx            # Navigation
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx           # Vendor/Admin sidebar
│   │   ├── SearchBar.tsx
│   │   └── LocationPicker.tsx
│   │
│   ├── discovery/
│   │   ├── ServiceCard.tsx       # Service listing card
│   │   ├── ServiceGrid.tsx       # Grid layout
│   │   ├── ServiceFilters.tsx    # Advanced filters
│   │   ├── SortOptions.tsx
│   │   └── CategoryCarousel.tsx
│   │
│   ├── service/
│   │   ├── ImageCarousel.tsx     # Product images
│   │   ├── ServiceInfo.tsx       # Title, description
│   │   ├── AmenitiesList.tsx     # Features
│   │   ├── PricingDisplay.tsx    # Price info
│   │   ├── VendorCard.tsx        # Vendor info
│   │   ├── RatingsSummary.tsx    # Star rating
│   │   └── ReviewsList.tsx       # Customer reviews
│   │
│   ├── booking/
│   │   ├── DateRangePicker.tsx   # Calendar
│   │   ├── GuestCounter.tsx      # Number selector
│   │   ├── CustomizationForm.tsx # Service options
│   │   ├── PriceBreakdown.tsx    # Total calculation
│   │   ├── BookingForm.tsx       # Main form
│   │   └── BookingConfirmation.tsx
│   │
│   ├── payment/
│   │   ├── PaymentMethod.tsx     # Payment options
│   │   ├── CardForm.tsx          # Razorpay form
│   │   ├── UPIForm.tsx
│   │   ├── PaymentStatus.tsx     # Success/Failure
│   │   └── PaymentReceipt.tsx
│   │
│   ├── vendor/
│   │   ├── BookingCard.tsx       # Booking item
│   │   ├── BookingTable.tsx      # Bookings list
│   │   ├── CalendarView.tsx      # Month view
│   │   ├── ServiceForm.tsx       # Create/edit service
│   │   ├── AvailabilityManager.tsx
│   │   ├── RevenueChart.tsx      # Analytics chart
│   │   └── StatsCard.tsx         # Metric card
│   │
│   ├── admin/
│   │   ├── VendorApproval.tsx    # Verification
│   │   ├── DisputeForm.tsx       # Resolution
│   │   ├── ReportsTable.tsx      # Data tables
│   │   └── AnalyticsCharts.tsx   # Charts
│   │
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       ├── OTPInput.tsx
│       └── PasswordReset.tsx
│
├── lib/
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Auth helpers
│   ├── booking.ts                # Booking helpers
│   ├── payment.ts                # Payment helpers
│   ├── search.ts                 # Search helpers
│   ├── validators.ts             # Form validation
│   ├── formatters.ts             # Date/currency formatting
│   └── constants.ts              # App constants
│
├── hooks/
│   ├── useAuth.ts                # Auth context hook
│   ├── useBooking.ts             # Booking logic
│   ├── useSearch.ts              # Search logic
│   ├── usePayment.ts             # Payment logic
│   ├── usePagination.ts          # Pagination
│   └── useLocalStorage.ts
│
├── context/
│   ├── AuthContext.tsx           # User auth state
│   ├── BookingContext.tsx        # Booking cart
│   ├── SearchContext.tsx         # Filter state
│   └── NotificationContext.tsx   # Toast messages
│
├── styles/
│   ├── globals.css
│   ├── variables.css             # Colors, fonts
│   └── animations.css
│
└── types/
    ├── index.ts                  # TypeScript interfaces
    ├── booking.ts
    ├── payment.ts
    ├── vendor.ts
    └── user.ts
```

---

## 🏠 Key Pages

### 1. Homepage (`pages/index.tsx`)

```tsx
import React from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import CategoryCarousel from '@/components/discovery/CategoryCarousel';
import FeaturedServices from '@/components/discovery/FeaturedServices';
import Testimonials from '@/components/common/Testimonials';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">
            Book Your Perfect Event Venue
          </h1>
          <p className="text-xl mb-8">
            Hotels, Marriage Halls, Birthday Venues & More
          </p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-4 grid grid-cols-4 gap-4">
            <div>
              <label className="text-gray-600 text-sm">What?</label>
              <input 
                type="text" 
                placeholder="Search services..." 
                className="w-full text-gray-900 py-2"
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm">Where?</label>
              <input 
                type="text" 
                placeholder="City, location" 
                className="w-full text-gray-900 py-2"
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm">When?</label>
              <input 
                type="date" 
                className="w-full text-gray-900 py-2"
              />
            </div>
            <button className="bg-blue-600 text-white py-2 rounded-lg font-semibold">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <CategoryCarousel />

      {/* Featured Services */}
      <FeaturedServices />

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Search & Browse</h3>
              <p className="text-gray-600">
                Find venues by category, location, date, and price
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Check & Compare</h3>
              <p className="text-gray-600">
                View details, photos, reviews, and availability
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
              <p className="text-gray-600">
                Secure online booking with instant confirmation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />
    </div>
  );
}
```

### 2. Search Results (`pages/search.tsx`)

```tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import ServiceFilters from '@/components/discovery/ServiceFilters';
import ServiceGrid from '@/components/discovery/ServiceGrid';
import { useSearch } from '@/hooks/useSearch';

export default function SearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    category: router.query.category || '',
    city: router.query.city || '',
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    sortBy: 'popularity'
  });

  const { services, loading, error } = useSearch(filters);

  return (
    <div className="flex gap-8 p-8 max-w-7xl mx-auto">
      {/* Sidebar Filters */}
      <aside className="w-64">
        <ServiceFilters 
          filters={filters} 
          onChange={setFilters} 
        />
      </aside>

      {/* Results */}
      <main className="flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {services?.length || 0} Results Found
          </h1>
          <select 
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className="border rounded px-4 py-2"
          >
            <option value="popularity">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">Error: {error}</div>}
        {services && <ServiceGrid services={services} />}
      </main>
    </div>
  );
}
```

### 3. Service Detail (`pages/services/[id].tsx`)

```tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ImageCarousel from '@/components/service/ImageCarousel';
import VendorCard from '@/components/service/VendorCard';
import RatingsSummary from '@/components/service/RatingsSummary';
import ReviewsList from '@/components/service/ReviewsList';
import { useApi } from '@/hooks/useApi';

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: service, loading } = useApi(`/api/services/${id}`);
  const { data: reviews } = useApi(`/api/services/${id}/reviews`);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="grid grid-cols-2 gap-12">
        {/* Left: Images & Info */}
        <div>
          <ImageCarousel images={service?.images} />
          
          <div className="mt-8">
            <h1 className="text-4xl font-bold mb-4">{service?.title}</h1>
            
            <RatingsSummary 
              rating={service?.rating}
              reviewCount={service?.reviewCount}
            />
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {service?.description}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                {service?.amenities?.map(amenity => (
                  <div key={amenity} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Vendor & Booking */}
        <div>
          <VendorCard vendor={service?.vendor} />
          
          <div className="bg-gray-50 rounded-lg p-8 mt-8 sticky top-20">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              ₹{service?.basePrice.toLocaleString()}
            </div>
            <p className="text-gray-600 mb-6">per booking</p>
            
            <button 
              onClick={() => setShowBookingForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mb-4"
            >
              Check Availability
            </button>
            
            <button className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold">
              ♥ Add to Favorites
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8">Guest Reviews</h2>
        <ReviewsList reviews={reviews} />
      </div>

      {/* Booking Modal */}
      {showBookingForm && (
        <BookingModal 
          serviceId={id}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
}
```

### 4. Booking Flow (`pages/bookings/create.tsx`)

```tsx
import React, { useState } from 'react';
import DateRangePicker from '@/components/booking/DateRangePicker';
import GuestCounter from '@/components/booking/GuestCounter';
import CustomizationForm from '@/components/booking/CustomizationForm';
import PriceBreakdown from '@/components/booking/PriceBreakdown';
import { useAuth } from '@/hooks/useAuth';

export default function CreateBookingPage() {
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState({
    serviceId: null,
    bookingDate: null,
    guestCount: 1,
    specialRequests: '',
    customizations: {}
  });

  const [totalPrice, setTotalPrice] = useState(0);

  const handleProceedToPayment = async () => {
    // Create booking
    // Redirect to payment
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Complete Your Booking</h1>

      <div className="grid grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">When?</h2>
            <DateRangePicker 
              onChange={(dates) => setBookingData({...bookingData, bookingDate: dates})}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">How many guests?</h2>
            <GuestCounter 
              value={bookingData.guestCount}
              onChange={(count) => setBookingData({...bookingData, guestCount: count})}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Customizations</h2>
            <CustomizationForm 
              onChange={(customizations) => setBookingData({...bookingData, customizations})}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Special Requests</h2>
            <textarea 
              className="w-full border rounded p-4 h-32"
              placeholder="Any special requests or preferences..."
              value={bookingData.specialRequests}
              onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
            />
          </div>
        </div>

        {/* Price Breakdown */}
        <aside className="sticky top-20">
          <PriceBreakdown 
            basePrice={1000}
            customizations={bookingData.customizations}
            onTotalChange={setTotalPrice}
          />
          
          <button 
            onClick={handleProceedToPayment}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mt-8"
          >
            Proceed to Payment (₹{totalPrice})
          </button>
        </aside>
      </div>
    </div>
  );
}
```

---

## 🎯 Key Components

### ServiceCard Component

```tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Star } from 'lucide-react';

export default function ServiceCard({ service }) {
  const [isFavorited, setIsFavorited] = React.useState(false);

  return (
    <Link href={`/services/${service.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <Image
            src={service.images[0]}
            alt={service.title}
            layout="fill"
            objectFit="cover"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited(!isFavorited);
            }}
            className="absolute top-4 right-4 bg-white rounded-full p-2"
          >
            <Heart 
              size={20} 
              fill={isFavorited ? '#ef4444' : 'none'}
              color={isFavorited ? '#ef4444' : '#999'}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 truncate">
            {service.title}
          </h3>
          
          <div className="flex items-center gap-1 mb-3">
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
            <span className="font-semibold">{service.rating}</span>
            <span className="text-gray-600">({service.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-gray-600 mb-3">
            <MapPin size={16} />
            <span className="text-sm">{service.city}</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600 text-sm">From</span>
              <p className="text-2xl font-bold text-blue-600">
                ₹{service.basePrice.toLocaleString()}
              </p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
              {service.categoryName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

---

## 🔐 Auth Context

```tsx
// context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and get user data
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { token, user } = await response.json();
    localStorage.setItem('authToken', token);
    setUser(user);
    router.push('/account/profile');
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 🎨 Design System

### Colors
```css
--primary: #2563eb    /* Blue */
--secondary: #7c3aed  /* Purple */
--success: #10b981    /* Green */
--warning: #f59e0b    /* Amber */
--danger: #ef4444     /* Red */
--gray-50: #f9fafb
--gray-900: #111827
```

### Typography
```css
--font-heading: 'Inter', sans-serif
--font-body: 'Inter', sans-serif
--font-mono: 'Fira Code', monospace

--text-h1: 2.5rem
--text-h2: 2rem
--text-h3: 1.5rem
--text-body: 1rem
--text-small: 0.875rem
```

---

**Frontend development is ready to start! 🎨**
