// backend/services/session.js
// Session tokens: short-lived (7 days), renewed while in use, and revocable.
// Each token carries the user's tokenVersion; raising the version (password reset or
// change, "sign out everywhere") makes every older token invalid immediately.
const jwt = require('jsonwebtoken');

const SESSION_TTL = process.env.SESSION_TTL || '7d';

function signSession(user) {
  return jwt.sign({ id: user._id, v: user.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: SESSION_TTL });
}

/** Invalidate all existing sessions for this user (caller saves the user). */
function revokeSessions(user) {
  user.tokenVersion = (user.tokenVersion || 0) + 1;
}

module.exports = { signSession, revokeSessions, SESSION_TTL };
