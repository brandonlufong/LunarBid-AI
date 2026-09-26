const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { pickProfile } = require('../utils/validate');

// Update profile
router.put('/', auth, async (req, res) => {
  try {
    // Only known fields, within length limits. A field sent as "" is cleared.
    const { error, update } = pickProfile(req.body);
    if (error) return res.status(400).json({ message: error });

    const user = await User.findById(req.user._id);
    const current = user.profile?.toObject ? user.profile.toObject() : { ...(user.profile || {}) };
    user.profile = { ...current, ...update };

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user.profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;