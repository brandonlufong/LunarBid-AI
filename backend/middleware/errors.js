// backend/middleware/errors.js
// Request IDs, JSON 404s and the single error handler. Clients get a generic
// message and a request id; details stay in the logs (and Sentry, if configured).
const crypto = require('crypto');
const log = require('../utils/logger');

function requestId(req, res, next) {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}

function notFound(req, res) {
  res.status(404).json({ message: 'Not found', requestId: req.id });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Known client errors
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body', requestId: req.id });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large', requestId: req.id });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Upload failed', requestId: req.id });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: 'Invalid request', requestId: req.id });
  if (err.status && err.status < 500 && err.expose) return res.status(err.status).json({ message: err.message, requestId: req.id });

  const isStripe = typeof err.type === 'string' && err.type.startsWith('Stripe');
  log.error({ err, requestId: req.id, path: req.path, method: req.method }, isStripe ? 'stripe error' : 'unhandled error');
  res.status(isStripe ? 502 : 500).json({
    message: isStripe ? 'The payment service could not complete this request. Please try again.' : 'Something went wrong. Please try again.',
    requestId: req.id,
  });
}

module.exports = { requestId, notFound, errorHandler };
