const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (name.trim().length < 2 || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Validation failed' });
    }

    // insert into contacts table
    const ip_address = req.ip || req.headers['x-forwarded-for'] || '';
    const connection = await pool.getConnection();
    const sql = 'INSERT INTO contacts (name, email, message, ip_address) VALUES (?, ?, ?, ?)';
    const [result] = await connection.query(sql, [name.trim(), email.trim(), message.trim(), ip_address]);
    connection.release();

    return res.json({ success: true, message: 'Thank you! Your message has been received.', contact_id: result.insertId });
  } catch (err) {
    console.error('Error in /api/contact:', err);
    if (connection) connection.release();
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
