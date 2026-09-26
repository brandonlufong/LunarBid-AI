// AI features need a confirmed email address, so free-plan limits can't be multiplied
// with throwaway accounts. Accounts created before verification existed count as verified.
module.exports = function requireVerifiedEmail(req, res, next) {
  if (req.user && req.user.emailVerified === false) {
    return res.status(403).json({
      message: 'Please confirm your email address to use AI features. Check your inbox, or request a new link.',
      code: 'email_unverified',
    });
  }
  next();
};
