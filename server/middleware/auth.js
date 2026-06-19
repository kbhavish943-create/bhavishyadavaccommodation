const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT Token
const generateToken = (userId, userRole) => {
  const token = jwt.sign(
    { userId, userRole },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  return token;
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

// Role-based Authorization Middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions for this operation' 
      });
    }

    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authorizeRole
};
