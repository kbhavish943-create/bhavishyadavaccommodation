import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Lock, Building2, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Head>
        <title>Hotel Booking System - Developer, Manager & Customer Portal</title>
        <meta name="description" content="Complete hotel booking platform with developer control, manager management, and customer booking" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">HotelBook</span>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Three-Tier Booking Platform
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Hotel Booking Platform
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-4 max-w-3xl mx-auto">
            Three distinct login systems for developers, managers, and customers
          </p>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Full control hierarchy: Developer → Manager → Customer
          </p>
        </div>
      </div>

      {/* Three Login Sections */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* SECTION 1: DEVELOPER LOGIN */}
            <div className="group hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-8 text-white text-center">
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Developer Login</h2>
                <p className="text-blue-100 text-sm">Super Admin Control</p>
              </div>
              
              <div className="bg-white border-2 border-blue-200 rounded-b-2xl p-8 shadow-lg">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Full System Control</p>
                      <p className="text-gray-600">Manage all hotels and managers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Feature Control</p>
                      <p className="text-gray-600">Toggle payment and booking on/off</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Manager Approval</p>
                      <p className="text-gray-600">Approve or reject manager requests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Analytics</p>
                      <p className="text-gray-600">System-wide metrics and reports</p>
                    </div>
                  </div>
                </div>

                <Link href="/auth/developer-login">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:gap-3">
                    Login as Developer
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">Demo:</span> ID: DEV001
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: HOTEL MANAGER LOGIN */}
            <div className="group hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-t-2xl p-8 text-white text-center">
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Manager Login</h2>
                <p className="text-green-100 text-sm">Hotel Management</p>
              </div>

              <div className="bg-white border-2 border-green-200 rounded-b-2xl p-8 shadow-lg">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Hotel Control</p>
                      <p className="text-gray-600">Manage your hotel details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Room Management</p>
                      <p className="text-gray-600">Add and manage rooms & pricing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Booking Control</p>
                      <p className="text-gray-600">View and manage reservations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Visibility Toggle</p>
                      <p className="text-gray-600">Show/hide hotel to customers</p>
                    </div>
                  </div>
                </div>

                <Link href="/auth/manager-login">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:gap-3">
                    Login as Manager
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">Status:</span> Requires developer approval
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: CUSTOMER LOGIN */}
            <div className="group hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-t-2xl p-8 text-white text-center">
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Customer Login</h2>
                <p className="text-purple-100 text-sm">OTP-Based Access</p>
              </div>

              <div className="bg-white border-2 border-purple-200 rounded-b-2xl p-8 shadow-lg">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Browse Hotels</p>
                      <p className="text-gray-600">View only visible hotels</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Check Availability</p>
                      <p className="text-gray-600">Real-time room availability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Secure Booking</p>
                      <p className="text-gray-600">Book and pay securely online</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex-shrink-0 mt-1"></div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">OTP Security</p>
                      <p className="text-gray-600">No password - SMS/Email OTP</p>
                    </div>
                  </div>
                </div>

                <Link href="/auth/customer-login">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:gap-3">
                    Login as Customer
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">Entry:</span> Phone number only (OTP)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-600">Developer</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-600">Manager</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-600">Customer</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">View All Hotels</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">Own Hotel</td>
                  <td className="text-center py-4 px-4">Visible Only</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">Manage Rooms</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">Set Pricing</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">Manage Bookings</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">Own Only</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">Make Bookings</td>
                  <td className="text-center py-4 px-4">❌</td>
                  <td className="text-center py-4 px-4">❌</td>
                  <td className="text-center py-4 px-4">✅</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">Toggle Features</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">View Only</td>
                  <td className="text-center py-4 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">View Analytics</td>
                  <td className="text-center py-4 px-4">System Wide</td>
                  <td className="text-center py-4 px-4">Hotel Only</td>
                  <td className="text-center py-4 px-4">❌</td>
                </tr>
                <tr className="hover:bg-white">
                  <td className="py-4 px-4 text-gray-900 font-medium">Approve Managers</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4">❌</td>
                  <td className="text-center py-4 px-4">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Control Hierarchy Info */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Control Hierarchy</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-4">
              {/* Developer */}
              <div className="w-full p-6 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-900">Developer (Highest Control)</h3>
                </div>
                <p className="text-sm text-blue-700">Super admin with full system control</p>
              </div>

              <div className="text-2xl text-gray-400">↓</div>

              {/* Manager */}
              <div className="w-full p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-xl font-bold text-green-900">Manager (Middle Control)</h3>
                </div>
                <p className="text-sm text-green-700">Controls only their assigned hotel</p>
              </div>

              <div className="text-2xl text-gray-400">↓</div>

              {/* Customer */}
              <div className="w-full p-6 bg-purple-50 border-2 border-purple-300 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-xl font-bold text-purple-900">Customer (Lowest Control)</h3>
                </div>
                <p className="text-sm text-purple-700">Access only approved hotels and rooms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            Hotel Booking System • Three-Tier Control Platform • 2024
          </p>
          <p className="text-xs text-gray-500 mt-2">
            All three login sections are visible without authentication
          </p>
        </div>
      </footer>
    </>
  );
}
