const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null  // null for individual users, set for team profiles
  },
  
  // Client Information
  profileName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  industry: {
    type: String,
    trim: true,
    default: ''
  },
  contactPerson: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Preferences
  preferredTone: {
    type: String,
    enum: ['formal', 'friendly', 'persuasive'],
    default: 'friendly'
  },
  preferredStyle: {
    type: String,
    enum: ['short', 'medium', 'detailed'],
    default: 'medium'
  },
  
  // Additional Info
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Relationship tracking
  totalProposalsSent: {
    type: Number,
    default: 0
  },
  totalProposalsWon: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  lastProposalDate: {
    type: Date,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
clientProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for win rate
clientProfileSchema.virtual('winRate').get(function() {
  if (this.totalProposalsSent === 0) return 0;
  return ((this.totalProposalsWon / this.totalProposalsSent) * 100).toFixed(1);
});

// Methods
clientProfileSchema.methods.incrementProposals = function(won = false, revenue = 0) {
  this.totalProposalsSent += 1;
  if (won) {
    this.totalProposalsWon += 1;
    this.totalRevenue += revenue;
  }
  this.lastProposalDate = new Date();
};

// Indexes
clientProfileSchema.index({ user: 1, isActive: 1 });
clientProfileSchema.index({ team: 1, isActive: 1 });
clientProfileSchema.index({ user: 1, createdAt: -1 });
clientProfileSchema.index({ tags: 1 });

// Ensure virtuals are included in JSON
clientProfileSchema.set('toJSON', { virtuals: true });
clientProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);