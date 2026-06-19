// src/config/database.js
// MongoDB Connection Configuration

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const uri = process.env.NODE_ENV === 'test'
    ? process.env.MONGODB_TEST_URI
    : process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MongoDB URI is not configured');
  }

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
    retryWrites: true
  });

  logger.info(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✓ MongoDB Disconnected');
  } catch (error) {
    logger.error(`Error disconnecting MongoDB: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
