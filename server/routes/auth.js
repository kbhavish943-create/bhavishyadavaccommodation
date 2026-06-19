const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper function to verify password
const verifyPassword = (password, hash) => {
  return hashPassword(password) === hash;
};

// ==================== DEVELOPER LOGIN ====================
router.post('/auth/developer/login', async (req, res) => {
  const { dev_id, password } = req.body;

  if (!dev_id || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'dev_id and password are required' 
    });
  }

  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT * FROM developers WHERE dev_id = ? AND status = ?',
      [dev_id, 'active']
    );

    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid dev_id or password' 
      });
    }

    const developer = rows[0];

    // For demo purposes - in production, use bcrypt
    if (developer.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid dev_id or password' 
      });
    }

    const accessToken = generateToken(developer.id, 'developer');
    const refreshToken = generateToken(developer.id, 'developer');

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: developer.id,
        dev_id: developer.dev_id,
        name: developer.name,
        email: developer.email
      },
      userRole: 'developer'
    });

  } catch (error) {
    console.error('Developer login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== MANAGER LOGIN ====================
router.post('/auth/manager/login', async (req, res) => {
  const { manager_id, password } = req.body;

  if (!manager_id || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'manager_id and password are required' 
    });
  }

  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      'SELECT m.*, h.name as hotel_name FROM managers m LEFT JOIN hotels h ON m.hotel_id = h.id WHERE m.manager_id = ?',
      [manager_id]
    );

    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid manager_id or password' 
      });
    }

    const manager = rows[0];

    // Verify password
    if (manager.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid manager_id or password' 
      });
    }

    // Check approval status
    if (manager.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        error: `Your account is ${manager.status}. Please wait for developer approval.` 
      });
    }

    const accessToken = generateToken(manager.id, 'manager');
    const refreshToken = generateToken(manager.id, 'manager');

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: manager.id,
        manager_id: manager.manager_id,
        name: manager.name,
        hotel_id: manager.hotel_id,
        hotel_name: manager.hotel_name,
        email: manager.email,
        phone: manager.phone
      },
      userRole: 'manager'
    });

  } catch (error) {
    console.error('Manager login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER OTP: REQUEST OTP ====================
router.post('/auth/customer/request-otp', async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ 
      success: false, 
      error: 'phone_number is required' 
    });
  }

  try {
    const connection = await pool.getConnection();

    // Check if customer exists, if not create
    let [customer] = await connection.query(
      'SELECT * FROM customers WHERE phone_number = ?',
      [phone_number]
    );

    let customerId;
    if (customer.length === 0) {
      const result = await connection.query(
        'INSERT INTO customers (phone_number, status) VALUES (?, ?)',
        [phone_number, 'active']
      );
      customerId = result[0].insertId;
    } else {
      customerId = customer[0].id;
      
      // Check if customer is blocked
      if (customer[0].status === 'blocked') {
        connection.release();
        return res.status(403).json({ 
          success: false, 
          error: 'Your account is blocked. Please contact support.' 
        });
      }

      // Check OTP attempt limit (max 5 attempts per 1 hour)
      if (customer[0].otp_attempts >= 5) {
        const lastRequest = new Date(customer[0].last_otp_request);
        const now = new Date();
        if ((now - lastRequest) < 3600000) { // 1 hour = 3600000 ms
          connection.release();
          return res.status(429).json({ 
            success: false, 
            error: 'Too many OTP requests. Try again later.' 
          });
        }
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update customer with OTP
    await connection.query(
      'UPDATE customers SET otp_code = ?, otp_expires_at = ?, otp_attempts = otp_attempts + 1, last_otp_request = NOW() WHERE id = ?',
      [otp, otpExpiresAt, customerId]
    );

    // Log OTP request
    await connection.query(
      'INSERT INTO otp_logs (phone_number, otp_code, request_type, status) VALUES (?, ?, ?, ?)',
      [phone_number, otp, 'request', 'sent']
    );

    connection.release();

    // In production, send OTP via SMS (using Twilio, AWS SNS, etc.)
    console.log(`[DEV] OTP for ${phone_number}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your phone',
      otp_expiry_seconds: 600, // 10 minutes
      // In production, don't return OTP in response
      // This is only for development/testing
      _dev_otp: otp
    });

  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== CUSTOMER OTP: VERIFY OTP ====================
router.post('/auth/customer/verify-otp', async (req, res) => {
  const { phone_number, otp_code } = req.body;

  if (!phone_number || !otp_code) {
    return res.status(400).json({ 
      success: false, 
      error: 'phone_number and otp_code are required' 
    });
  }

  try {
    const connection = await pool.getConnection();

    const [customers] = await connection.query(
      'SELECT * FROM customers WHERE phone_number = ?',
      [phone_number]
    );

    if (customers.length === 0) {
      connection.release();
      return res.status(401).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    const customer = customers[0];

    // Check if OTP is expired
    if (!customer.otp_expires_at || new Date() > new Date(customer.otp_expires_at)) {
      await connection.query(
        'INSERT INTO otp_logs (phone_number, otp_code, request_type, status) VALUES (?, ?, ?, ?)',
        [phone_number, otp_code, 'verify', 'expired']
      );
      
      connection.release();
      return res.status(401).json({ 
        success: false, 
        error: 'OTP has expired' 
      });
    }

    // Verify OTP
    if (customer.otp_code !== otp_code) {
      await connection.query(
        'INSERT INTO otp_logs (phone_number, otp_code, request_type, status) VALUES (?, ?, ?, ?)',
        [phone_number, otp_code, 'verify', 'failed']
      );
      
      connection.release();
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid OTP' 
      });
    }

    // Clear OTP
    await connection.query(
      'UPDATE customers SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?',
      [customer.id]
    );

    // Log successful verification
    await connection.query(
      'INSERT INTO otp_logs (phone_number, otp_code, request_type, status) VALUES (?, ?, ?, ?)',
      [phone_number, otp_code, 'verify', 'verified']
    );

    connection.release();

    const accessToken = generateToken(customer.id, 'customer');
    const refreshToken = generateToken(customer.id, 'customer');

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        customer_id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name,
        email: customer.email
      },
      userRole: 'customer'
    });

  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
