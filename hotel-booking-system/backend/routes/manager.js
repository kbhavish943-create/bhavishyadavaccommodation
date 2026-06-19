/**
 * Hotel Manager Routes
 * Manager-specific endpoints for room management, pricing, and booking controls
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireManager, enforceControlPriority, sendSuccess, sendError } = require('../middleware/auth');

// All manager routes require authentication and manager role
router.use(authenticateToken);
router.use(requireManager);
router.use(enforceControlPriority);

// ============================================================
// 1. ROOM MANAGEMENT
// ============================================================

/**
 * GET /api/manager/rooms
 * Get all rooms for manager's hotel
 */
router.get('/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.execute(
      `SELECT r.id, r.room_number, r.room_type, r.price_per_night, 
              r.max_occupancy, r.amenities, r.is_available, r.hotel_id,
              COUNT(DISTINCT b.id) as booking_count
       FROM rooms r
       LEFT JOIN bookings b ON r.id = b.room_id
       WHERE r.hotel_id = ?
       GROUP BY r.id
       ORDER BY r.room_number`,
      [req.user.hotel_id]
    );

    return sendSuccess(res, rooms, 'Rooms retrieved successfully');
  } catch (error) {
    console.error('Get rooms error:', error);
    return sendError(res, 500, 'Server error retrieving rooms', 'SERVER_ERROR');
  }
});

/**
 * POST /api/manager/rooms
 * Add a new room to manager's hotel
 */
router.post('/rooms', async (req, res) => {
  try {
    const { room_number, room_type, price_per_night, max_occupancy, amenities, photos } = req.body;

    // Validate required fields
    if (!room_number || !room_type || !price_per_night || !max_occupancy) {
      return sendError(res, 400, 'Missing required fields', 'MISSING_FIELDS');
    }

    const [result] = await pool.execute(
      `INSERT INTO rooms (hotel_id, room_number, room_type, price_per_night, max_occupancy, amenities, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.hotel_id, room_number, room_type, price_per_night, max_occupancy, amenities || null, photos || null]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['manager', req.user.id, 'create_room', 'room', result.insertId, JSON.stringify({ room_number, room_type })]
    );

    return sendSuccess(res, {
      id: result.insertId,
      room_number, room_type, price_per_night, max_occupancy
    }, 'Room created successfully', 201);

  } catch (error) {
    console.error('Create room error:', error);
    return sendError(res, 500, 'Server error creating room', 'SERVER_ERROR');
  }
});

/**
 * PUT /api/manager/rooms/:id
 * Update room details
 */
router.put('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, room_type, price_per_night, max_occupancy, amenities, photos } = req.body;

    // Check room belongs to manager's hotel
    const [rooms] = await pool.execute(
      'SELECT id FROM rooms WHERE id = ? AND hotel_id = ?',
      [id, req.user.hotel_id]
    );

    if (rooms.length === 0) {
      return sendError(res, 404, 'Room not found', 'NOT_FOUND');
    }

    // Update room
    await pool.execute(
      `UPDATE rooms SET room_number = ?, room_type = ?, price_per_night = ?, 
                        max_occupancy = ?, amenities = ?, photos = ? WHERE id = ?`,
      [room_number, room_type, price_per_night, max_occupancy, amenities || null, photos || null, id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      ['manager', req.user.id, 'update_room', 'room', id]
    );

    return sendSuccess(res, { id, room_number, room_type, price_per_night }, 'Room updated successfully');

  } catch (error) {
    console.error('Update room error:', error);
    return sendError(res, 500, 'Server error updating room', 'SERVER_ERROR');
  }
});

/**
 * DELETE /api/manager/rooms/:id
 * Delete/deactivate a room
 */
router.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check room belongs to manager's hotel
    const [rooms] = await pool.execute(
      'SELECT id FROM rooms WHERE id = ? AND hotel_id = ?',
      [id, req.user.hotel_id]
    );

    if (rooms.length === 0) {
      return sendError(res, 404, 'Room not found', 'NOT_FOUND');
    }

    // Deactivate room
    await pool.execute('UPDATE rooms SET is_available = FALSE WHERE id = ?', [id]);

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      ['manager', req.user.id, 'delete_room', 'room', id]
    );

    return sendSuccess(res, null, 'Room deleted successfully');

  } catch (error) {
    console.error('Delete room error:', error);
    return sendError(res, 500, 'Server error deleting room', 'SERVER_ERROR');
  }
});

// ============================================================
// 2. PRICING MANAGEMENT
// ============================================================

/**
 * PUT /api/manager/rooms/:id/price
 * Update room price
 */
router.put('/rooms/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { price_per_night } = req.body;

    if (!price_per_night || price_per_night <= 0) {
      return sendError(res, 400, 'Valid price is required', 'INVALID_PRICE');
    }

    // Check room belongs to manager's hotel
    const [rooms] = await pool.execute(
      'SELECT id FROM rooms WHERE id = ? AND hotel_id = ?',
      [id, req.user.hotel_id]
    );

    if (rooms.length === 0) {
      return sendError(res, 404, 'Room not found', 'NOT_FOUND');
    }

    // Update price
    await pool.execute('UPDATE rooms SET price_per_night = ? WHERE id = ?', [price_per_night, id]);

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['manager', req.user.id, 'update_price', 'room', id, JSON.stringify({ price_per_night })]
    );

    return sendSuccess(res, { id, price_per_night }, 'Price updated successfully');

  } catch (error) {
    console.error('Update price error:', error);
    return sendError(res, 500, 'Server error updating price', 'SERVER_ERROR');
  }
});

// ============================================================
// 3. BOOKING MANAGEMENT
// ============================================================

/**
 * GET /api/manager/bookings
 * Get all bookings for manager's hotel
 */
router.get('/bookings', async (req, res) => {
  try {
    const { status, check_in_date, check_out_date } = req.query;

    let query = `SELECT b.id, b.booking_reference, c.name as customer_name, c.phone_number,
                        r.room_number, r.room_type, b.check_in_date, b.check_out_date, 
                        b.status, b.total_price, b.created_at
                 FROM bookings b
                 JOIN customers c ON b.customer_id = c.id
                 JOIN rooms r ON b.room_id = r.id
                 WHERE r.hotel_id = ?`;

    const params = [req.user.hotel_id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (check_in_date) {
      query += ' AND b.check_in_date >= ?';
      params.push(check_in_date);
    }

    if (check_out_date) {
      query += ' AND b.check_out_date <= ?';
      params.push(check_out_date);
    }

    query += ' ORDER BY b.check_in_date DESC';

    const [bookings] = await pool.execute(query, params);

    return sendSuccess(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    console.error('Get bookings error:', error);
    return sendError(res, 500, 'Server error retrieving bookings', 'SERVER_ERROR');
  }
});

/**
 * GET /api/manager/bookings/:id
 * Get booking details
 */
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [bookings] = await pool.execute(
      `SELECT b.*, c.name as customer_name, c.phone_number, c.email,
              r.room_number, r.room_type, h.name as hotel_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       JOIN hotels h ON r.hotel_id = h.id
       WHERE b.id = ? AND h.id = ?`,
      [id, req.user.hotel_id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    // Get booking status history
    const [history] = await pool.execute(
      'SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY created_at DESC',
      [id]
    );

    return sendSuccess(res, { ...bookings[0], history }, 'Booking details retrieved successfully');
  } catch (error) {
    console.error('Get booking error:', error);
    return sendError(res, 500, 'Server error retrieving booking', 'SERVER_ERROR');
  }
});

/**
 * PUT /api/manager/bookings/:id/status
 * Update booking status
 */
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid booking status', 'INVALID_STATUS');
    }

    // Check booking belongs to manager's hotel
    const [bookings] = await pool.execute(
      `SELECT b.id, b.status FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ? AND r.hotel_id = ?`,
      [id, req.user.hotel_id]
    );

    if (bookings.length === 0) {
      return sendError(res, 404, 'Booking not found', 'NOT_FOUND');
    }

    const oldStatus = bookings[0].status;

    // Update booking status
    await pool.execute('UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

    // Add to status history
    await pool.execute(
      'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_type, changed_by_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, oldStatus, status, 'manager', req.user.id, notes || null]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['manager', req.user.id, 'update_booking_status', 'booking', id, JSON.stringify({ old: oldStatus, new: status })]
    );

    return sendSuccess(res, { id, status }, 'Booking status updated successfully');

  } catch (error) {
    console.error('Update booking status error:', error);
    return sendError(res, 500, 'Server error updating booking status', 'SERVER_ERROR');
  }
});

// ============================================================
// 4. FEATURE TOGGLES (Manager-level controls)
// ============================================================

/**
 * GET /api/manager/controls
 * Get manager's feature controls for their hotel
 */
router.get('/controls', async (req, res) => {
  try {
    // Get global settings first
    const [globalSettings] = await pool.execute(
      'SELECT setting_key, setting_value FROM website_settings'
    );

    // Check if there are manager-specific overrides in booking rules
    // For now, managers work with global settings defined by developer

    const controls = {};
    globalSettings.forEach(s => {
      controls[s.setting_key] = s.setting_value === 'true' ? true : s.setting_value === 'false' ? false : s.setting_value;
    });

    return sendSuccess(res, controls, 'Controls retrieved successfully');
  } catch (error) {
    console.error('Get controls error:', error);
    return sendError(res, 500, 'Server error retrieving controls', 'SERVER_ERROR');
  }
});

// ============================================================
// 5. ANALYTICS FOR MANAGER
// ============================================================

/**
 * GET /api/manager/analytics
 * Get analytics for manager's hotel
 */
router.get('/analytics', async (req, res) => {
  try {
    // Hotel overview
    const [hotelStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        COALESCE(SUM(b.total_price), 0) as total_revenue
       FROM rooms r
       LEFT JOIN bookings b ON r.id = b.room_id
       WHERE r.hotel_id = ?`,
      [req.user.hotel_id]
    );

    // Room occupancy
    const [roomOccupancy] = await pool.execute(
      `SELECT r.room_number, r.room_type,
              COUNT(b.id) as booking_count,
              ROUND(COUNT(b.id) / COUNT(DISTINCT DATE(DATE_ADD(CURDATE(), INTERVAL -30 DAY))) * 100, 2) as occupancy_rate
       FROM rooms r
       LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'confirmed' AND b.created_at >= DATE_ADD(NOW(), INTERVAL -30 DAY)
       WHERE r.hotel_id = ?
       GROUP BY r.id
       ORDER BY booking_count DESC`,
      [req.user.hotel_id]
    );

    // Recent bookings
    const [recentBookings] = await pool.execute(
      `SELECT b.id, b.booking_reference, c.name, b.check_in_date, b.status, b.total_price
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       WHERE r.hotel_id = ?
       ORDER BY b.created_at DESC
       LIMIT 10`,
      [req.user.hotel_id]
    );

    return sendSuccess(res, {
      stats: hotelStats[0],
      room_occupancy: roomOccupancy,
      recent_bookings: recentBookings
    }, 'Analytics retrieved successfully');

  } catch (error) {
    console.error('Get analytics error:', error);
    return sendError(res, 500, 'Server error retrieving analytics', 'SERVER_ERROR');
  }
});

module.exports = router;
