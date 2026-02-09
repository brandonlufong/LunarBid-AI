const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Update profile
router.put('/', auth, async (req, res) => {
  try {
    const { 
      experience, 
      skills, 
      hourlyRate, 
      portfolio, 
      bio,
      role,
      preferredTone,
      platformFocus
    } = req.body;

    const user = await User.findById(req.user._id);
    
    user.profile = {
      experience: experience || user.profile.experience,
      skills: skills || user.profile.skills,
      hourlyRate: hourlyRate || user.profile.hourlyRate,
      portfolio: portfolio || user.profile.portfolio,
      bio: bio || user.profile.bio,
      role: role || user.profile.role,
      preferredTone: preferredTone || user.profile.preferredTone,
      platformFocus: platformFocus || user.profile.platformFocus
    };

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