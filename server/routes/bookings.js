const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Helper to generate booking ID
const generateBookingId = () => {
  return `BK${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
};

// ==================== CUSTOMER: CREATE BOOKING ====================
router.post('/customer/bookings', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { hotelId, roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

  if (!hotelId || !roomId || !checkInDate || !checkOutDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'hotelId, roomId, checkInDate, and checkOutDate are required' 
    });
  }

  try {
    const connection = await pool.getConnection();

    // Get room details for pricing
    const [rooms] = await connection.query(
      'SELECT * FROM rooms WHERE id = ? AND hotel_id = ?',
      [roomId, hotelId]
    );

    if (rooms.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'Room not found' 
      });
    }

    const room = rooms[0];
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid dates' 
      });
    }

    const totalPrice = room.price_per_night * nights;
    const bookingId = generateBookingId();

    const result = await connection.query(
      `INSERT INTO bookings (booking_id, hotel_id, room_id, customer_id, check_in_date, check_out_date, number_of_guests, total_price, special_requests, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, hotelId, roomId, req.user.userId, checkInDate, checkOutDate, numberOfGuests || 1, totalPrice, specialRequests || null, 'pending', 'pending']
    );

    connection.release();

    res.json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: bookingId,
        id: result[0].insertId,
        hotelId,
        roomId,
        checkInDate,
        checkOutDate,
        numberOfNights: nights,
        totalPrice,
        status: 'pending',
        paymentStatus: 'pending'
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: GET MY BOOKINGS ====================
router.get('/customer/bookings', authenticateToken, authorizeRole('customer'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      `SELECT b.*, h.name as hotel_name, r.room_number 
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.customer_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );

    connection.release();

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: GET BOOKING DETAILS ====================
router.get('/customer/bookings/:bookingId', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { bookingId } = req.params;

  try {
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      `SELECT b.*, h.name as hotel_name, r.room_number 
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.booking_id = ? AND b.customer_id = ?`,
      [bookingId, req.user.userId]
    );

    connection.release();

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      data: bookings[0]
    });

  } catch (error) {
    console.error('Get booking error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: CANCEL BOOKING ====================
router.put('/customer/bookings/:bookingId/cancel', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { bookingId } = req.params;

  try {
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND customer_id = ?',
      [bookingId, req.user.userId]
    );

    if (bookings.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    if (booking.status === 'cancelled') {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        error: 'Booking is already cancelled' 
      });
    }

    await connection.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
      ['cancelled', bookingId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: GET HOTEL BOOKINGS ====================
router.get('/manager/bookings', authenticateToken, authorizeRole('manager'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get manager's hotel
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    if (managers.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'No hotel assigned' 
      });
    }

    const hotelId = managers[0].hotel_id;

    const [bookings] = await connection.query(
      `SELECT b.*, r.room_number, c.phone_number as customer_phone
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN customers c ON b.customer_id = c.id
       WHERE b.hotel_id = ?
       ORDER BY b.check_in_date DESC`,
      [hotelId]
    );

    connection.release();

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get hotel bookings error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: UPDATE BOOKING STATUS ====================
router.put('/manager/bookings/:id/status', authenticateToken, authorizeRole('manager'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status' 
    });
  }

  try {
    const connection = await pool.getConnection();

    // Verify booking belongs to manager's hotel
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    const [bookings] = await connection.query(
      'SELECT hotel_id FROM bookings WHERE id = ?',
      [id]
    );

    if (managers.length === 0 || bookings.length === 0 || bookings[0].hotel_id !== managers[0].hotel_id) {
      connection.release();
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    await connection.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Booking status updated'
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
