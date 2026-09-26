const express = require('express');
const router = express.Router();
const ClientProfile = require('../models/ClientProfile');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { pickClientProfile } = require('../utils/validate');
const checkFeatureAccess = require('../middleware/checkFeatureAccess');

// ===============================
// Get all client profiles
// ===============================
router.get('/', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { search, tags, isActive, isFavorite } = req.query;
    
    let query = { user: user._id, isActive: true };
    
    // Add team profiles if user is in a team
    if (user.team.teamId) {
      query = {
        $or: [
          { user: user._id },
          { team: user.team.teamId }
        ],
        isActive: true
      };
    }
    
    // Apply filters
    if (search) {
      query.$or = [
        { profileName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === 'true';
    }
    
    const profiles = await ClientProfile.find(query)
      .sort({ isFavorite: -1, createdAt: -1 })
      .limit(100);
    
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching client profiles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Create new client profile
// ===============================
router.post('/', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = user.getPlanLimits();
    
    // Check if user has reached profile limit
    const existingCount = await ClientProfile.countDocuments({ 
      user: user._id, 
      isActive: true 
    });
    
    if (limits.clientProfiles !== null && existingCount >= limits.clientProfiles) {
      return res.status(403).json({ 
        message: `Client profile limit reached (${limits.clientProfiles} profiles). Upgrade for more profiles.`,
        limit: limits.clientProfiles,
        current: existingCount
      });
    }
    
    const { error, fields } = pickClientProfile(req.body, { requireName: true });
    if (error) return res.status(400).json({ message: error });
    const { profileName, companyName, industry, contactPerson, email, phone, preferredTone, preferredStyle, notes, tags, isFavorite } = fields;
    
    const profile = new ClientProfile({
      user: user._id,
      team: user.team.teamId || null,
      profileName,
      companyName,
      industry,
      contactPerson,
      email,
      phone,
      preferredTone: preferredTone || 'friendly',
      preferredStyle: preferredStyle || 'medium',
      notes,
      tags: tags || [],
      isFavorite: isFavorite || false
    });
    
    await profile.save();
    
    res.status(201).json({
      message: 'Client profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Error creating client profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get single client profile
// ===============================
router.get('/:id', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    let query = { _id: req.params.id, user: user._id };
    
    // Allow access to team profiles
    if (user.team.teamId) {
      query = {
        _id: req.params.id,
        $or: [
          { user: user._id },
          { team: user.team.teamId }
        ]
      };
    }
    
    const profile = await ClientProfile.findOne(query);
    
    if (!profile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Update client profile
// ===============================
router.put('/:id', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    // Only editable fields: owner, team and counters can never be changed by a request.
    const { error, fields: updateFields } = pickClientProfile(req.body);
    if (error) return res.status(400).json({ message: error });

    const user = await User.findById(req.user._id);
    
    let query = { _id: req.params.id, user: user._id };
    
    if (user.team.teamId) {
      query = {
        _id: req.params.id,
        $or: [
          { user: user._id },
          { team: user.team.teamId }
        ]
      };
    }
    
    const profile = await ClientProfile.findOneAndUpdate(
      query,
      { $set: { ...updateFields, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );
    
    if (!profile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    res.json({
      message: 'Client profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Toggle favorite status
// ===============================
router.patch('/:id/favorite', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    profile.isFavorite = !profile.isFavorite;
    await profile.save();
    
    res.json({
      message: 'Favorite status updated',
      isFavorite: profile.isFavorite
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Soft delete client profile
// ===============================
router.delete('/:id', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    const profile = await ClientProfile.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    res.json({ message: 'Client profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting client profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get profile stats
// ===============================
router.get('/:id/stats', auth, checkFeatureAccess('clientProfiles'), async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    
    res.json({
      totalProposalsSent: profile.totalProposalsSent,
      totalProposalsWon: profile.totalProposalsWon,
      winRate: profile.winRate,
      totalRevenue: profile.totalRevenue,
      lastProposalDate: profile.lastProposalDate
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;