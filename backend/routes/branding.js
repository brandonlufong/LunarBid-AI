const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkFeatureAccess = require('../middleware/checkFeatureAccess');
const multer = require('multer'); // npm install multer
const path = require('path');
const fs = require('fs').promises;

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads/logos';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, svg) are allowed'));
    }
  }
});

// ===============================
// Get branding settings
// ===============================
router.get('/', auth, checkFeatureAccess('customBranding'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      branding: user.branding,
      plan: user.subscription.plan,
      whiteLabel: user.hasFeatureAccess('whiteLabel')
    });
  } catch (error) {
    console.error('Error fetching branding:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Update branding settings
// ===============================
router.put('/', auth, checkFeatureAccess('customBranding'), async (req, res) => {
  try {
    const {
      primaryColor,
      secondaryColor,
      companyName,
      tagline,
      website
    } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Validate color format (hex)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return res.status(400).json({ 
        message: 'Invalid primary color format. Use hex color (e.g., #6366f1)' 
      });
    }
    
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return res.status(400).json({ 
        message: 'Invalid secondary color format. Use hex color (e.g., #8b5cf6)' 
      });
    }
    
    // Update branding
    if (primaryColor) user.branding.primaryColor = primaryColor;
    if (secondaryColor) user.branding.secondaryColor = secondaryColor;
    if (companyName) user.branding.companyName = companyName;
    if (tagline) user.branding.tagline = tagline;
    if (website) user.branding.website = website;
    
    await user.save();
    
    res.json({
      message: 'Branding settings updated successfully',
      branding: user.branding
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Upload logo
// ===============================
router.post('/logo', 
  auth, 
  checkFeatureAccess('customBranding'), 
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const user = await User.findById(req.user._id);
      
      // Delete old logo if exists
      if (user.branding.logoUrl) {
        try {
          const oldLogoPath = path.join(__dirname, '..', user.branding.logoUrl);
          await fs.unlink(oldLogoPath);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }
      
      // Save new logo URL (relative path)
      user.branding.logoUrl = `/uploads/logos/${req.file.filename}`;
      await user.save();
      
      res.json({
        message: 'Logo uploaded successfully',
        logoUrl: user.branding.logoUrl
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ===============================
// Delete logo
// ===============================
router.delete('/logo', auth, checkFeatureAccess('customBranding'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.branding.logoUrl) {
      return res.status(404).json({ message: 'No logo to delete' });
    }
    
    // Delete file
    try {
      const logoPath = path.join(__dirname, '..', user.branding.logoUrl);
      await fs.unlink(logoPath);
    } catch (error) {
      console.error('Error deleting logo file:', error);
    }
    
    // Remove from database
    user.branding.logoUrl = '';
    await user.save();
    
    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Reset branding to defaults
// ===============================
router.post('/reset', auth, checkFeatureAccess('customBranding'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Delete logo if exists
    if (user.branding.logoUrl) {
      try {
        const logoPath = path.join(__dirname, '..', user.branding.logoUrl);
        await fs.unlink(logoPath);
      } catch (error) {
        console.error('Error deleting logo file:', error);
      }
    }
    
    // Reset to defaults
    user.branding = {
      logoUrl: '',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      companyName: '',
      tagline: '',
      website: ''
    };
    
    await user.save();
    
    res.json({
      message: 'Branding reset to defaults',
      branding: user.branding
    });
  } catch (error) {
    console.error('Error resetting branding:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get branding preview (for proposals)
// ===============================
router.get('/preview', auth, checkFeatureAccess('customBranding'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { proposalText } = req.query;
    
    // Generate HTML preview with branding applied
    const preview = generateBrandedPreview(user.branding, proposalText || 'Sample proposal text...');
    
    res.json({
      preview,
      branding: user.branding
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Helper Functions
// ===============================

function generateBrandedPreview(branding, proposalText) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid ${branding.primaryColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .company-name {
      color: ${branding.primaryColor};
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0 5px 0;
    }
    .tagline {
      color: ${branding.secondaryColor};
      font-size: 14px;
      font-style: italic;
    }
    .content {
      line-height: 1.6;
      color: #333;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${branding.secondaryColor};
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .cta-button {
      background-color: ${branding.primaryColor};
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" class="logo">` : ''}
    ${branding.companyName ? `<div class="company-name">${branding.companyName}</div>` : ''}
    ${branding.tagline ? `<div class="tagline">${branding.tagline}</div>` : ''}
  </div>
  
  <div class="content">
    ${proposalText}
  </div>
  
  <a href="#" class="cta-button">Let's Work Together</a>
  
  <div class="footer">
    ${branding.companyName || 'Your Company'}
    ${branding.website ? ` | ${branding.website}` : ''}
  </div>
</body>
</html>
  `.trim();
}

module.exports = router;