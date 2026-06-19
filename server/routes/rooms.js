const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ==================== MANAGER: GET HOTEL ROOMS ====================
router.get('/manager/rooms', authenticateToken, authorizeRole('manager'), async (req, res) => {
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

    const [rooms] = await connection.query(
      'SELECT * FROM rooms WHERE hotel_id = ? ORDER BY room_number ASC',
      [hotelId]
    );

    connection.release();

    res.json({
      success: true,
      data: rooms
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: CREATE ROOM ====================
router.post('/manager/rooms', authenticateToken, authorizeRole('manager'), async (req, res) => {
  const { room_number, room_type, capacity, price_per_night, description, amenities } = req.body;

  if (!room_number || !price_per_night) {
    return res.status(400).json({ 
      success: false, 
      error: 'room_number and price_per_night are required' 
    });
  }

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

    const result = await connection.query(
      `INSERT INTO rooms (hotel_id, room_number, room_type, capacity, price_per_night, description, amenities) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [hotelId, room_number, room_type || 'double', capacity || 2, price_per_night, description, amenities ? JSON.stringify(amenities) : null]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Room created successfully',
      data: { id: result[0].insertId }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Room number already exists in this hotel' 
      });
    }
    console.error('Create room error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: UPDATE ROOM ====================
router.put('/manager/rooms/:id', authenticateToken, authorizeRole('manager'), async (req, res) => {
  const { id } = req.params;
  const { room_type, capacity, price_per_night, description, status, amenities } = req.body;

  try {
    const connection = await pool.getConnection();
    
    // Verify room belongs to manager's hotel
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    const [rooms] = await connection.query(
      'SELECT hotel_id FROM rooms WHERE id = ?',
      [id]
    );

    if (managers.length === 0 || rooms.length === 0 || rooms[0].hotel_id !== managers[0].hotel_id) {
      connection.release();
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to update this room' 
      });
    }

    await connection.query(
      `UPDATE rooms 
       SET room_type = COALESCE(?, room_type),
           capacity = COALESCE(?, capacity),
           price_per_night = COALESCE(?, price_per_night),
           description = COALESCE(?, description),
           status = COALESCE(?, status),
           amenities = COALESCE(?, amenities),
           updated_at = NOW()
       WHERE id = ?`,
      [room_type, capacity, price_per_night, description, status, amenities ? JSON.stringify(amenities) : null, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Room updated successfully'
    });

  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER: DELETE ROOM ====================
router.delete('/manager/rooms/:id', authenticateToken, authorizeRole('manager'), async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    
    // Verify room belongs to manager's hotel
    const [managers] = await connection.query(
      'SELECT hotel_id FROM managers WHERE id = ?',
      [req.user.userId]
    );

    const [rooms] = await connection.query(
      'SELECT hotel_id FROM rooms WHERE id = ?',
      [id]
    );

    if (managers.length === 0 || rooms.length === 0 || rooms[0].hotel_id !== managers[0].hotel_id) {
      connection.release();
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to delete this room' 
      });
    }

    await connection.query('DELETE FROM rooms WHERE id = ?', [id]);
    connection.release();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER: GET ROOM AVAILABILITY ====================
router.get('/customer/hotels/:hotelId/availability', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'checkInDate and checkOutDate are required' 
    });
  }

  try {
    const connection = await pool.getConnection();

    // Verify hotel is visible
    const [hotels] = await connection.query(
      'SELECT id FROM hotels WHERE id = ? AND is_visible = TRUE',
      [hotelId]
    );

    if (hotels.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        error: 'Hotel not found' 
      });
    }

    // Get available rooms (not booked in the date range)
    const [rooms] = await connection.query(
      `SELECT r.* FROM rooms r
       WHERE r.hotel_id = ? AND r.status = 'available'
       AND r.id NOT IN (
         SELECT room_id FROM bookings 
         WHERE hotel_id = ? 
         AND status != 'cancelled'
         AND (
           (check_in_date < ? AND check_out_date > ?)
         )
       )
       ORDER BY r.room_type, r.price_per_night`,
      [hotelId, hotelId, checkOutDate, checkInDate]
    );

    connection.release();

    res.json({
      success: true,
      checkInDate,
      checkOutDate,
      availableRooms: rooms
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== PUBLIC: GET ROOM DETAILS ====================
router.get('/hotels/:hotelId/rooms/:roomId', async (req, res) => {
  const { hotelId, roomId } = req.params;

  try {
    const connection = await pool.getConnection();

    const [rooms] = await connection.query(
      `SELECT r.* FROM rooms r
       JOIN hotels h ON r.hotel_id = h.id
       WHERE r.id = ? AND r.hotel_id = ? AND h.is_visible = TRUE`,
      [roomId, hotelId]
    );

    connection.release();

    if (rooms.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Room not found' 
      });
    }

    res.json({
      success: true,
      data: rooms[0]
    });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
