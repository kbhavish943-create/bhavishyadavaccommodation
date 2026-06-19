/**
 * Developer Routes
 * Super Admin endpoints for managing hotels, managers, settings, and analytics
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireDeveloper, enforceControlPriority, sendSuccess, sendError } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// All developer routes require authentication and developer role
router.use(authenticateToken);
router.use(requireDeveloper);
router.use(enforceControlPriority);

// ============================================================
// 1. HOTEL MANAGEMENT
// ============================================================

/**
 * GET /api/developer/hotels
 * Get all hotels with manager info and stats
 */
router.get('/hotels', async (req, res) => {
  try {
    const [hotels] = await pool.execute(
      `SELECT h.id, h.name, h.city, h.address, h.phone_number,
              COUNT(DISTINCT hm.id) as manager_count,
              COUNT(DISTINCT r.id) as room_count,
              COUNT(DISTINCT b.id) as booking_count,
              h.created_at
       FROM hotels h
       LEFT JOIN hotel_managers hm ON h.id = hm.hotel_id
       LEFT JOIN rooms r ON h.id = r.hotel_id
       LEFT JOIN bookings b ON h.id = b.hotel_id
       GROUP BY h.id
       ORDER BY h.created_at DESC`
    );

    return sendSuccess(res, hotels, 'Hotels retrieved successfully');
  } catch (error) {
    console.error('Get hotels error:', error);
    return sendError(res, 500, 'Server error retrieving hotels', 'SERVER_ERROR');
  }
});

/**
 * POST /api/developer/hotels
 * Create a new hotel
 */
router.post('/hotels', async (req, res) => {
  try {
    const { name, city, state, address, phone_number, email, description } = req.body;

    // Validate required fields
    if (!name || !city || !state || !address || !phone_number) {
      return sendError(res, 400, 'Missing required fields', 'MISSING_FIELDS');
    }

    const [result] = await pool.execute(
      `INSERT INTO hotels (name, city, state, address, phone_number, email, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, city, state, address, phone_number, email || null, description || null]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['developer', req.user.id, 'create', 'hotel', result.insertId, JSON.stringify({ name })]
    );

    return sendSuccess(res, {
      id: result.insertId,
      name, city, state, address, phone_number, email, description
    }, 'Hotel created successfully', 201);

  } catch (error) {
    console.error('Create hotel error:', error);
    return sendError(res, 500, 'Server error creating hotel', 'SERVER_ERROR');
  }
});

/**
 * PUT /api/developer/hotels/:id
 * Update hotel details
 */
router.put('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, state, address, phone_number, email, description } = req.body;

    // Check if hotel exists
    const [hotels] = await pool.execute('SELECT id FROM hotels WHERE id = ?', [id]);
    if (hotels.length === 0) {
      return sendError(res, 404, 'Hotel not found', 'NOT_FOUND');
    }

    // Update hotel
    await pool.execute(
      `UPDATE hotels SET name = ?, city = ?, state = ?, address = ?, phone_number = ?, email = ?, description = ?
       WHERE id = ?`,
      [name, city, state, address, phone_number, email || null, description || null, id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['developer', req.user.id, 'update', 'hotel', id, JSON.stringify({ name })]
    );

    return sendSuccess(res, { id, name, city, state, address, phone_number }, 'Hotel updated successfully');

  } catch (error) {
    console.error('Update hotel error:', error);
    return sendError(res, 500, 'Server error updating hotel', 'SERVER_ERROR');
  }
});

/**
 * DELETE /api/developer/hotels/:id
 * Delete a hotel (soft delete)
 */
router.delete('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if hotel exists
    const [hotels] = await pool.execute('SELECT id FROM hotels WHERE id = ?', [id]);
    if (hotels.length === 0) {
      return sendError(res, 404, 'Hotel not found', 'NOT_FOUND');
    }

    // Soft delete (mark as inactive)
    await pool.execute('UPDATE hotels SET is_active = FALSE WHERE id = ?', [id]);

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      ['developer', req.user.id, 'delete', 'hotel', id]
    );

    return sendSuccess(res, null, 'Hotel deleted successfully');

  } catch (error) {
    console.error('Delete hotel error:', error);
    return sendError(res, 500, 'Server error deleting hotel', 'SERVER_ERROR');
  }
});

// ============================================================
// 2. MANAGER APPROVALS
// ============================================================

/**
 * GET /api/developer/manager-requests
 * Get pending manager approval requests
 */
router.get('/manager-requests', async (req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT hm.id, hm.manager_id, hm.name, hm.email, hm.phone_number, 
              h.name as hotel_name, hm.created_at, hm.is_approved_by_developer
       FROM hotel_managers hm
       JOIN hotels h ON hm.hotel_id = h.id
       WHERE hm.is_approved_by_developer = FALSE
       ORDER BY hm.created_at ASC`
    );

    return sendSuccess(res, requests, 'Manager requests retrieved successfully');
  } catch (error) {
    console.error('Get manager requests error:', error);
    return sendError(res, 500, 'Server error retrieving requests', 'SERVER_ERROR');
  }
});

/**
 * POST /api/developer/manager-requests/:id/approve
 * Approve a manager
 */
router.post('/manager-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if manager request exists
    const [managers] = await pool.execute(
      'SELECT id, manager_id, hotel_id FROM hotel_managers WHERE id = ?',
      [id]
    );

    if (managers.length === 0) {
      return sendError(res, 404, 'Manager request not found', 'NOT_FOUND');
    }

    // Approve manager
    await pool.execute(
      'UPDATE hotel_managers SET is_approved_by_developer = TRUE, approved_at = NOW() WHERE id = ?',
      [id]
    );

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['developer', req.user.id, 'approve', 'manager', id, JSON.stringify({ notes })]
    );

    return sendSuccess(res, { id, status: 'approved' }, 'Manager approved successfully');

  } catch (error) {
    console.error('Approve manager error:', error);
    return sendError(res, 500, 'Server error approving manager', 'SERVER_ERROR');
  }
});

/**
 * POST /api/developer/manager-requests/:id/reject
 * Reject a manager request
 */
router.post('/manager-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if manager request exists
    const [managers] = await pool.execute(
      'SELECT id FROM hotel_managers WHERE id = ?',
      [id]
    );

    if (managers.length === 0) {
      return sendError(res, 404, 'Manager request not found', 'NOT_FOUND');
    }

    // Delete the manager request (rejection)
    await pool.execute('DELETE FROM hotel_managers WHERE id = ?', [id]);

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      ['developer', req.user.id, 'reject', 'manager', id, JSON.stringify({ reason })]
    );

    return sendSuccess(res, null, 'Manager request rejected');

  } catch (error) {
    console.error('Reject manager error:', error);
    return sendError(res, 500, 'Server error rejecting manager', 'SERVER_ERROR');
  }
});

// ============================================================
// 3. WEBSITE SETTINGS
// ============================================================

/**
 * GET /api/developer/settings
 * Get all website settings
 */
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.execute(
      'SELECT id, setting_key, setting_value, description FROM website_settings ORDER BY setting_key'
    );

    const settingsObject = {};
    settings.forEach(s => {
      settingsObject[s.setting_key] = {
        value: s.setting_value === 'true' ? true : s.setting_value === 'false' ? false : s.setting_value,
        description: s.description
      };
    });

    return sendSuccess(res, settingsObject, 'Settings retrieved successfully');
  } catch (error) {
    console.error('Get settings error:', error);
    return sendError(res, 500, 'Server error retrieving settings', 'SERVER_ERROR');
  }
});

/**
 * PUT /api/developer/settings/:key
 * Update a specific setting
 */
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return sendError(res, 400, 'Setting value is required', 'MISSING_FIELD');
    }

    // Update setting
    const [result] = await pool.execute(
      'UPDATE website_settings SET setting_value = ? WHERE setting_key = ?',
      [String(value), key]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'Setting not found', 'NOT_FOUND');
    }

    // Log the action
    await pool.execute(
      'INSERT INTO audit_logs (user_type, user_id, action, entity_type, details) VALUES (?, ?, ?, ?, ?)',
      ['developer', req.user.id, 'update_setting', 'website_settings', JSON.stringify({ [key]: value })]
    );

    return sendSuccess(res, { [key]: value }, 'Setting updated successfully');

  } catch (error) {
    console.error('Update setting error:', error);
    return sendError(res, 500, 'Server error updating setting', 'SERVER_ERROR');
  }
});

// ============================================================
// 4. ANALYTICS & REPORTS
// ============================================================

/**
 * GET /api/developer/analytics/dashboard
 * Get dashboard analytics
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    // Total statistics
    const [stats] = await pool.execute(
      `SELECT 
        (SELECT COUNT(*) FROM hotels WHERE is_active = TRUE) as total_hotels,
        (SELECT COUNT(*) FROM hotel_managers WHERE is_approved_by_developer = TRUE) as total_managers,
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed') as total_revenue
       FROM DUAL`
    );

    // Recent bookings
    const [recentBookings] = await pool.execute(
      `SELECT b.id, b.booking_reference, c.name as customer_name, 
              h.name as hotel_name, r.room_number, b.check_in_date, b.status
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       JOIN hotels h ON r.hotel_id = h.id
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    // Hotel-wise booking stats
    const [hotelStats] = await pool.execute(
      `SELECT h.id, h.name, 
              COUNT(b.id) as booking_count,
              SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
              COUNT(r.id) as room_count
       FROM hotels h
       LEFT JOIN bookings b ON h.id = b.hotel_id
       LEFT JOIN rooms r ON h.id = r.hotel_id
       GROUP BY h.id
       ORDER BY booking_count DESC`
    );

    return sendSuccess(res, {
      stats: stats[0],
      recent_bookings: recentBookings,
      hotel_stats: hotelStats
    }, 'Analytics retrieved successfully');

  } catch (error) {
    console.error('Get analytics error:', error);
    return sendError(res, 500, 'Server error retrieving analytics', 'SERVER_ERROR');
  }
});

/**
 * GET /api/developer/analytics/payments
 * Get payment analytics
 */
router.get('/analytics/payments', async (req, res) => {
  try {
    const [paymentStats] = await pool.execute(
      `SELECT 
        (SELECT COUNT(*) FROM payments) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'failed') as failed_count,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed') as total_amount,
        (SELECT COALESCE(AVG(amount), 0) FROM payments WHERE payment_status = 'completed') as avg_amount
       FROM DUAL`
    );

    const [paymentsByGateway] = await pool.execute(
      `SELECT payment_gateway, 
              COUNT(*) as count,
              COALESCE(SUM(amount), 0) as total_amount
       FROM payments
       WHERE payment_status = 'completed'
       GROUP BY payment_gateway`
    );

    const [dailyPayments] = await pool.execute(
      `SELECT DATE(payment_date) as date,
              COUNT(*) as count,
              COALESCE(SUM(amount), 0) as total_amount
       FROM payments
       WHERE payment_status = 'completed'
       GROUP BY DATE(payment_date)
       ORDER BY date DESC
       LIMIT 30`
    );

    return sendSuccess(res, {
      stats: paymentStats[0],
      by_gateway: paymentsByGateway,
      daily: dailyPayments
    }, 'Payment analytics retrieved successfully');

  } catch (error) {
    console.error('Get payment analytics error:', error);
    return sendError(res, 500, 'Server error retrieving payment analytics', 'SERVER_ERROR');
  }
});

/**
 * GET /api/developer/audit-logs
 * Get audit logs for compliance
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, entity_type, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (entity_type) {
      query += ' AND entity_type = ?';
      params.push(entity_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];

    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }

    if (entity_type) {
      countQuery += ' AND entity_type = ?';
      countParams.push(entity_type);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return sendSuccess(res, {
      logs,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, 'Audit logs retrieved successfully');

  } catch (error) {
    console.error('Get audit logs error:', error);
    return sendError(res, 500, 'Server error retrieving audit logs', 'SERVER_ERROR');
  }
});

module.exports = router;
