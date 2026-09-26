// Single-use codes that hand a completed OAuth sign-in to the frontend without putting
// the session token in a URL. Each code works once and expires after two minutes.
const mongoose = require('mongoose');

const oauthCodeSchema = new mongoose.Schema({
  _id: { type: String }, // sha256 of the code
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 },
});

module.exports = mongoose.model('OAuthCode', oauthCodeSchema);
