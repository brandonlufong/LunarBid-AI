const mongoose = require('mongoose');
const log = require('../utils/logger');

// Connects with retries so a brief database outage at deploy time doesn't crash the API.
const connectDB = async (attempts = 5) => {
  for (let i = 1; i <= attempts; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      log.info('MongoDB connected');
      return;
    } catch (err) {
      log.error({ attempt: i, err: err.message }, 'MongoDB connection failed');
      if (i === attempts) process.exit(1);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
};

module.exports = connectDB;
