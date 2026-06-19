// server/index.js OR src/index.js
// Entry Point for Backend Server

require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { initCache, closeCache } = require('./services/cacheService');

const PORT = process.env.PORT || 3000;

let server;

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
    logger.info('HTTP server closed');
  }

  await disconnectDB();
  await closeCache();
  process.exit(0);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const start = async () => {
  await connectDB();
  logger.info('MongoDB connected');
  await initCache();

  server = app.listen(PORT, () => {
    logger.info(`
      ╔═══════════════════════════════════════╗
      ║   Event Booking Platform Backend      ║
      ║        Server Started Successfully    ║
      ╠═══════════════════════════════════════╣
      ║ Port: ${PORT}
      ║ Environment: ${process.env.NODE_ENV || 'development'}
      ║ API URL: http://localhost:${PORT}
      ║ Health: http://localhost:${PORT}/health
      ╚═══════════════════════════════════════╝
    `);
  });
};

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
