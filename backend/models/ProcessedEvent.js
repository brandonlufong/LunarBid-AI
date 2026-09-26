// Stripe webhook events already applied, so retried deliveries are not processed twice.
// Records expire after 30 days; Stripe stops retrying long before that.
const mongoose = require('mongoose');

const processedEventSchema = new mongoose.Schema({
  _id: { type: String }, // Stripe event id (evt_...)
  type: { type: String },
  processedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

module.exports = mongoose.model('ProcessedEvent', processedEventSchema);
