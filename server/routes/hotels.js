const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ==================== DEVELOPER: GET ALL HOTELS ====================
router.get('/developer/hotels', authenticateToken, authorizeRole('developer'), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [hotels] = await connection.query(
      `SELECT h.*, COUNT(r.id) as room_count 
       FROM hotels h 
       LEFT JOIN rooms r ON h.id = r.hotel_id 
       GROUP BY h.id 
       ORDER BY h.created_at DESC`
    );

    connection.release();

    res.json({
      success: true,
      data: hotels
    });

  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: CREATE HOTEL ====================
router.post('/developer/hotels', authenticateToken, authorizeRole('developer'), async (req, res) => {
  const { name, city, address, phone, email, description } = req.body;

  if (!name || !city) {
    return res.status(400).json({ 
      success: false, 
      error: 'name and city are required' 
    });
  }

  try {
    const connection = await pool.getConnection();
    
    const result = await connection.query(
      `INSERT INTO hotels (name, city, address, phone, email, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, city, address, phone, email, description, req.user.userId]
    );

    const hotelId = result[0].insertId;

    // Create hotel toggles
    await connection.query(
      `INSERT INTO hotel_toggles (hotel_id, updated_by) VALUES (?, ?)`,
      [hotelId, req.user.userId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Hotel created successfully',
      data: { id: hotelId }
    });

  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: UPDATE HOTEL ====================
router.put('/developer/hotels/:id', authenticateToken, authorizeRole('developer'), async (req, res) => {
  const { id } = req.params;
  const { name, city, address, phone, email, description, is_visible } = req.body;

  try {
    const connection = await pool.getConnection();
    
    await connection.query(
      `UPDATE hotels 
       SET name = COALESCE(?, name), 
           city = COALESCE(?, city), 
           address = COALESCE(?, address),
           phone = COALESCE(?, phone),
           email = COALESCE(?, email),
           description = COALESCE(?, description),
           is_visible = COALESCE(?, is_visible),
           updated_at = NOW()
       WHERE id = ?`,
      [name, city, address, phone, email, description, is_visible, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Hotel updated successfully'
    });

  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DEVELOPER: DELETE HOTEL ====================
router.delete('/developer/hotels/:id', authenticateToken, authorizeRole('developer'), async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    
    await connection.query('DELETE FROM hotels WHERE id = ?', [id]);
    connection.release();

    res.json({
      success: true,
      message: 'Hotel deleted successfully'
    });

  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: GET HOTEL DETAILS ====================
router.get('/manager/hotel', authenticateToken, authorizeRole('manager'), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    if (managers.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'Hotel not assigned to this manager' 
      });
    }

    const hotelId = managers[0].hotel_id;

    const [hotels] = await connection.query(
      `SELECT h.*, COUNT(r.id) as room_count 
       FROM hotels h 
       LEFT JOIN rooms r ON h.id = r.hotel_id 
       WHERE h.id = ? 
       GROUP BY h.id`,
      [hotelId]
    );

    connection.release();

    res.json({
      success: true,
      data: hotels[0] || null
    });

  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: UPDATE HOTEL DETAILS ====================
router.put('/manager/hotel', authenticateToken, authorizeRole('manager'), async (req, res) => {
  const { name, description } = req.body;

  try {
    const connection = await pool.getConnection();
    
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    if (managers.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'Hotel not assigned' 
      });
    }

    const hotelId = managers[0].hotel_id;

    await connection.query(
      `UPDATE hotels 
       SET name = COALESCE(?, name), 
           description = COALESCE(?, description),
           updated_at = NOW()
       WHERE id = ?`,
      [name, description, hotelId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Hotel updated successfully'
    });

  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: LIST VISIBLE HOTELS ====================
router.get('/customer/hotels', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { city } = req.query;

  try {
    const connection = await pool.getConnection();
    
    let query = `SELECT h.*, COUNT(r.id) as room_count 
                 FROM hotels h 
                 LEFT JOIN rooms r ON h.id = r.hotel_id 
                 WHERE h.is_visible = TRUE AND h.status = 'active'`;
    let params = [];

    if (city) {
      query += ` AND h.city LIKE ?`;
      params.push(`%${city}%`);
    }

    query += ` GROUP BY h.id ORDER BY h.created_at DESC`;

    const [hotels] = await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      data: hotels
    });

  } catch (error) {
    console.error('Get visible hotels error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== PUBLIC: GET HOTEL DETAILS (for browsing) ====================
router.get('/hotels/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    
    const [hotels] = await connection.query(
      `SELECT h.* FROM hotels h 
       WHERE h.id = ? AND h.is_visible = TRUE AND h.status = 'active'`,
      [id]
    );

    connection.release();

    if (hotels.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Hotel not found' 
      });
    }

    res.json({
      success: true,
      data: hotels[0]
    });

  } catch (error) {
    console.error('Get hotel details error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
