/**
 * MySQL Database Connection Pool
 * Handles connection pooling and database operations
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_booking_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  multipleStatements: false
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✓ Database connected successfully');
    connection.release();
  })
  .catch(error => {
    console.error('✗ Database connection failed:', error.message);
    console.error('Connection details:');
    console.error(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`  User: ${process.env.DB_USER || 'root'}`);
    console.error(`  Database: ${process.env.DB_NAME || 'hotel_booking_system'}`);
    process.exit(1);
  });

module.exports = pool;
