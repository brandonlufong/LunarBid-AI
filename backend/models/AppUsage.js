// backend/models/AppUsage.js
// Application-wide AI spend meter. One document per period, keyed by a string id
// (e.g. "spend:2026-11-24" for a day, "spend:2026-11" for a month). Incremented
// atomically with $inc so concurrent generations can't lose a count.
const mongoose = require('mongoose');

const appUsageSchema = new mongoose.Schema(
  {
    _id: String,
    spendUsd: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model('AppUsage', appUsageSchema);
