/**
 * Customer Routes
 * Customer-facing endpoints for browsing hotels, rooms, and making bookings
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireCustomer, enforceControlPriority, sendSuccess, sendError } = require('../middleware/auth');

// Public routes (no auth required)

/**
 * GET /api/customer/hotels
 * Get all available hotels (public endpoint)
 * Optional query: city, room_type, check_in, check_out, guests
 */
router.get('/hotels', async (req, res) => {
  try {
    const { city, check_in, check_out, guests } = req.query;

    let query = `SELECT h.id, h.name, h.city, h.state, h.address, h.phone_number, 
                        h.email, h.description,
                        COUNT(DISTINCT r.id) as room_count,
                        MIN(r.price_per_night) as min_price
                 FROM hotels h
                 LEFT JOIN rooms r ON h.id = r.id AND r.is_available = TRUE
                 WHERE h.is_active = TRUE`;

    const params = [];

    if (city) {
      query += ' AND LOWER(h.city) LIKE ?';
      params.push(`%${city.toLowerCase()}%`);
    }

    query += ' GROUP BY h.id ORDER BY h.name';

    const [hotels] = await pool.execute(query, params);

    // Get available rooms for each hotel (if check-in/check-out provided)
    if (check_in && check_out) {
      const [availableRooms] = await pool.execute(
        `SELECT r.id, r.hotel_id, r.room_number, r.room_type, 
                r.price_per_night, r.max_occupancy, r.amenities
         FROM rooms r
         WHERE r.hotel_id IN (?) 
         AND r.is_available = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM bookings b 
           WHERE b.room_id = r.id 
           AND b.status IN ('confirmed', 'pending')
           AND b.check_in_date < ? 
           AND b.check_out_date > ?
         )
         ORDER BY r.price_per_night`,
        [hotels.map(h => h.id), check_out, check_in]
      );

      // Attach available rooms to each hotel
      hotels.forEach(hotel => {
        hotel.available_rooms = availableRooms.filter(r => r.hotel_id === hotel.id);
      });
    }

    return sendSuccess(res, hotels, 'Hotels retrieved successfully');
  } catch (error) {
    console.error('Get hotels error:', error);
    return sendError(res, 500, 'Server error retrieving hotels', 'SERVER_ERROR');
  }
});

/**
 * GET /api/customer/hotels/:id
 * Get hotel details with rooms
 */
router.get('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get hotel details
    const [hotels] = await pool.execute(
      `SELECT * FROM hotels WHERE id = ? AND is_active = TRUE`,
      [id]
    );

    if (hotels.length === 0) {
      return sendError(res, 404, 'Hotel not found', 'NOT_FOUND');
    }

    const hotel = hotels[0];

    // Get rooms
    const [rooms] = await pool.execute(
      `SELECT id, room_number, room_type, price_per_night, max_occupancy, amenities, photos
       FROM rooms
       WHERE hotel_id = ? AND is_available = TRUE
       ORDER BY room_type, price_per_night`,
      [id]
    );

    hotel.rooms = rooms;

    return sendSuccess(res, hotel, 'Hotel details retrieved successfully');
  } catch (error) {
    console.error('Get hotel details error:', error);
    return sendError(res, 500, 'Server error retrieving hotel', 'SERVER_ERROR');
  }
});

// Protected routes (authentication required)

/**
 * POST /api/customer/bookings
 * Create a new booking
 * Required: room_id, check_in_date, check_out_date, guest_count
 */
router.post('/bookings', authenticateToken, requireCustomer, enforceControlPriority, async (req, res) => {
  try {
    const { room_id, check_in_date, check_out_date, guest_count, special_requests } = req.body;

    // Validate input
    if (!room_id || !check_in_date || !check_out_date || !guest_count) {
      return sendError(res, 400, 'Missing required fields', 'MISSING_FIELDS');
    }

    // Check if online payment is enabled (Developer & Manager approval)
    const [settings] = await pool.execute(
      'SELECT setting_value FROM website_settings WHERE setting_key = ?',
      ['online_payment_enabled']
    );

    const paymentEnabled = settings.length > 0 && settings[0].setting_value === 'true';

    // Get room details
    const [rooms] = await pool.execute(
      `SELECT r.id, r.hotel_id, r.price_per_night, r.max_occupancy, hm.id as manager_id
       FROM rooms r
       JOIN hotels h ON r.hotel_id = h.id
       LEFT JOIN hotel_managers hm ON h.id = hm.hotel_id
       WHERE r.id = ? AND r.is_available = TRUE`,
      [room_id]
    );

    if (rooms.length === 0) {
      return sendError(res, 404, 'Room not found', 'NOT_FOUND');
    }

    const room = rooms[0];

    // Check guest count
    if (guest_count > room.max_occupancy) {
      return sendError(res, 400, 'Guest count exceeds room capacity', 'INVALID_GUEST_COUNT');
    }

    // Check room availability using stored procedure
    const [availability] = await pool.execute(
      'CALL CheckRoomAvailability(?, ?, ?, @is_available)',
      [room_id, check_in_date, check_out_date]
    );

    // Calculate total price
    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.price_per_night;

    // Create booking reference
    const bookingReference = `BK${Date.now()}`;

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO bookings (customer_id, room_id, hotel_id, booking_reference, 
                            check_in_date, check_out_date, guest_count, 
                            total_price, special_requests, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, room_id, room.hotel_id, bookingReference, 
       check_in_date, check_out_date, guest_count, totalPrice, special_requests || null, 'pending']
    );

    const bookingId = result.insertId;

    // Add to booking status history
    await pool.execute(
      'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_type, changed_by_id) VALUES (?, ?, ?, ?, ?)',
      [bookingId, 'created', 'pending', 'customer', req.user.id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      ['customer', req.user.id, 'create_booking', 'booking', bookingId]
    );

    return sendSuccess(res, {
      id: bookingId,
      booking_reference: bookingReference,
      room_id,
      check_in_date,
      check_out_date,
      nights,
      total_price: totalPrice,
      status: 'pending',
      payment_enabled: paymentEnabled
    }, 'Booking created successfully', 201);

  } catch (error) {
    console.error('Create booking error:', error);
    return sendError(res, 500, 'Server error creating booking', 'SERVER_ERROR');
  }
});

/**
 * GET /api/customer/bookings
 * Get customer's bookings
 */
router.get('/bookings', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.id, b.booking_reference, h.name as hotel_name, r.room_number, r.room_type,
              b.check_in_date, b.check_out_date, b.total_price, b.status, b.created_at
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN hotels h ON b.hotel_id = h.id
       WHERE b.customer_id = ?
       ORDER BY b.check_in_date DESC`,
      [req.user.id]
    );

    return sendSuccess(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    console.error('Get bookings error:', error);
    return sendError(res, 500, 'Server error retrieving bookings', 'SERVER_ERROR');
  }
});

/**
 * GET /api/customer/bookings/:id
 * Get booking details
 */
router.get('/bookings/:id', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { id } = req.params;

    const [bookings] = await pool.execute(
      `SELECT b.*, h.name as hotel_name, h.city, r.room_number, r.room_type, 
              r.price_per_night, r.amenities, r.photos
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN hotels h ON b.hotel_id = h.id
       WHERE b.id = ? AND b.customer_id = ?`,
      [id, req.user.id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    const booking = bookings[0];

    // Get payment info if exists
    const [payments] = await pool.execute(
      'SELECT id, payment_gateway, amount, payment_date, payment_status FROM payments WHERE booking_id = ?',
      [id]
    );

    booking.payment = payments.length > 0 ? payments[0] : null;

    return sendSuccess(res, booking, 'Booking details retrieved successfully');
  } catch (error) {
    console.error('Get booking error:', error);
    return sendError(res, 500, 'Server error retrieving booking', 'SERVER_ERROR');
  }
});

/**
 * PUT /api/customer/bookings/:id/cancel
 * Cancel a booking
 */
router.put('/bookings/:id/cancel', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Check if booking belongs to customer
    const [bookings] = await pool.execute(
      'SELECT id, status FROM bookings WHERE id = ? AND customer_id = ?',
      [id, req.user.id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    const booking = bookings[0];

    // Can't cancel if already completed or cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return sendError(res, 400, `Cannot cancel ${booking.status} booking`, 'INVALID_ACTION');
    }

    // Update booking status
    await pool.execute(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', id]
    );

    // Add to status history
    await pool.execute(
      'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_type, changed_by_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, booking.status, 'cancelled', 'customer', req.user.id, cancellation_reason || null]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      ['customer', req.user.id, 'cancel_booking', 'booking', id]
    );

    return sendSuccess(res, { id, status: 'cancelled' }, 'Booking cancelled successfully');

  } catch (error) {
    console.error('Cancel booking error:', error);
    return sendError(res, 500, 'Server error cancelling booking', 'SERVER_ERROR');
  }
});

/**
 * GET /api/customer/profile
 * Get customer profile
 */
router.get('/profile', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const [customers] = await pool.execute(
      'SELECT id, phone_number, name, email, is_phone_verified, last_login, created_at FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return sendError(res, 404, 'Customer not found', 'NOT_FOUND');
    }

    return sendSuccess(res, customers[0], 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 500, 'Server error retrieving profile', 'SERVER_ERROR');
  }
});

/**
 * PUT /api/customer/profile
 * Update customer profile
 */
router.put('/profile', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name) {
      return sendError(res, 400, 'Name is required', 'MISSING_FIELD');
    }

    await pool.execute(
      'UPDATE customers SET name = ?, email = ? WHERE id = ?',
      [name, email || null, req.user.id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type) VALUES (?, ?, ?, ?)',
      ['customer', req.user.id, 'update_profile', 'customer']
    );

    return sendSuccess(res, { name, email }, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 500, 'Server error updating profile', 'SERVER_ERROR');
  }
});

module.exports = router;
