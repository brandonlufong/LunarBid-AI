// backend/server.js
require('dotenv').config();
require('./instrument'); // error reporting first, so it can see everything below
const log = require('./utils/logger');
const { validateEnv } = require('./config/env');

validateEnv(log);

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  const server = app.listen(PORT, () => log.info(`LunarBid API listening on port ${PORT}`));

  // Graceful shutdown: finish in-flight requests, then close the database.
  const shutdown = (signal) => {
    log.info(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.disconnect().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
