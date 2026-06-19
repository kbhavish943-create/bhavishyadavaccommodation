const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ==================== DEVELOPER: GET FEATURE TOGGLES ====================
router.get('/developer/toggles', authenticateToken, authorizeRole('developer'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [toggles] = await connection.query(
      'SELECT * FROM feature_toggles ORDER BY feature_name'
    );

    connection.release();

    res.json({
      success: true,
      data: toggles
    });

  } catch (error) {
    console.error('Get toggles error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: UPDATE FEATURE TOGGLE ====================
router.put('/developer/toggles/:featureName', authenticateToken, authorizeRole('developer'), async (req, res) => {
  const { featureName } = req.params;
  const { isEnabled } = req.body;

  if (typeof isEnabled !== 'boolean') {
    return res.status(400).json({ 
      success: false, 
      error: 'isEnabled must be a boolean' 
    });
  }

  try {
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE feature_toggles SET is_enabled = ?, updated_by = ? WHERE feature_name = ?',
      [isEnabled, req.user.userId, featureName]
    );

    connection.release();

    res.json({
      success: true,
      message: `Feature ${featureName} is now ${isEnabled ? 'enabled' : 'disabled'}`
    });

  } catch (error) {
    console.error('Update toggle error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: GET MANAGER APPROVAL REQUESTS ====================
router.get('/developer/manager-approvals', authenticateToken, authorizeRole('developer'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [managers] = await connection.query(
      `SELECT m.*, h.name as hotel_name 
       FROM managers m 
       LEFT JOIN hotels h ON m.hotel_id = h.id
       WHERE m.status = 'pending'
       ORDER BY m.created_at ASC`
    );

    connection.release();

    res.json({
      success: true,
      data: managers
    });

  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: APPROVE MANAGER ====================
router.put('/developer/managers/:managerId/approve', authenticateToken, authorizeRole('developer'), async (req, res) => {
  const { managerId } = req.params;

  try {
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE managers SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['approved', req.user.userId, managerId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Manager approved successfully'
    });

  } catch (error) {
    console.error('Approve manager error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: REJECT MANAGER ====================
router.put('/developer/managers/:managerId/reject', authenticateToken, authorizeRole('developer'), async (req, res) => {
  const { managerId } = req.params;

  try {
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE managers SET status = ? WHERE id = ?',
      ['rejected', managerId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Manager rejected'
    });

  } catch (error) {
    console.error('Reject manager error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: GET ANALYTICS ====================
router.get('/developer/analytics', authenticateToken, authorizeRole('developer'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Total hotels
    const [hotelsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM hotels WHERE status = "active"'
    );

    // Active managers
    const [managersCount] = await connection.query(
      'SELECT COUNT(*) as count FROM managers WHERE status = "approved"'
    );

    // Total bookings
    const [bookingsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM bookings WHERE status != "cancelled"'
    );

    // Total revenue
    const [revenue] = await connection.query(
      'SELECT SUM(total_price) as total FROM bookings WHERE payment_status = "paid"'
    );

    // Bookings by status
    const [bookingsByStatus] = await connection.query(
      'SELECT status, COUNT(*) as count FROM bookings GROUP BY status'
    );

    // Customers count
    const [customersCount] = await connection.query(
      'SELECT COUNT(*) as count FROM customers WHERE status = "active"'
    );

    connection.release();

    res.json({
      success: true,
      data: {
        totalHotels: hotelsCount[0].count,
        activeManagers: managersCount[0].count,
        totalBookings: bookingsCount[0].count,
        totalRevenue: revenue[0].total || 0,
        activeCustomers: customersCount[0].count,
        bookingsByStatus: bookingsByStatus
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: GET HOTEL TOGGLES ====================
router.get('/manager/hotel-toggles', authenticateToken, authorizeRole('manager'), async (req, res) => {
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

    const [toggles] = await connection.query(
      'SELECT * FROM hotel_toggles WHERE hotel_id = ?',
      [hotelId]
    );

    connection.release();

    if (toggles.length === 0) {
      return res.json({
        success: true,
        data: {
          hotelId,
          showToCustomers: true,
          enableOnlineBooking: true,
          enableOnlinePayment: true
        }
      });
    }

    res.json({
      success: true,
      data: toggles[0]
    });

  } catch (error) {
    console.error('Get hotel toggles error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: UPDATE HOTEL TOGGLES ====================
router.put('/manager/hotel-toggles', authenticateToken, authorizeRole('manager'), async (req, res) => {
  const { showToCustomers, enableOnlineBooking, enableOnlinePayment } = req.body;

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

    // Update hotel toggles
    await connection.query(
      `UPDATE hotel_toggles 
       SET show_to_customers = COALESCE(?, show_to_customers),
           enable_online_booking = COALESCE(?, enable_online_booking),
           enable_online_payment = COALESCE(?, enable_online_payment),
           updated_by = ?
       WHERE hotel_id = ?`,
      [showToCustomers, enableOnlineBooking, enableOnlinePayment, req.user.userId, hotelId]
    );

    // Also update main hotels table for visibility
    await connection.query(
      'UPDATE hotels SET is_visible = ? WHERE id = ?',
      [showToCustomers, hotelId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Hotel toggles updated successfully'
    });

  } catch (error) {
    console.error('Update hotel toggles error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
