const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Signed-in user required. Rejects expired tokens and tokens issued before the user's
// sessions were revoked (tokenVersion). Responses carry a `code` the frontend can act on.
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Please sign in.', code: 'no_session' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      message: expired ? 'Your session has expired. Please sign in again.' : 'Please sign in again.',
      code: expired ? 'session_expired' : 'session_invalid',
    });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Please sign in again.', code: 'session_invalid' });
    }
    if ((decoded.v || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'You were signed out. Please sign in again.', code: 'session_revoked' });
    }
    req.user = user;
    req.tokenIssuedAt = decoded.iat;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
