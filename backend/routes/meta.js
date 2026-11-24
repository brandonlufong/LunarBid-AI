// backend/routes/meta.js
// Public, client-safe app flags (beta banner, feature gating). No secrets.
const express = require('express');
const router = express.Router();
const beta = require('../config/beta');

router.get('/', (req, res) => {
  res.json(beta.publicFlags());
});

module.exports = router;
