const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    default: ''
  },
  budget: {
    type: String,
    default: ''
  },
  tone: {
    type: String,
    enum: ['formal', 'friendly', 'persuasive'],
    default: 'friendly'
  },
  length: {
    type: String,
    enum: ['short', 'medium', 'detailed'],
    default: 'medium'
  },
  generatedProposal: {
    type: String,
    required: true
  },
  editedProposal: {
    type: String,
    default: ''
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected'],
    default: 'draft'
  },

  // Public shareable link
  shareToken: {
    type: String,
    default: null,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  firstViewedAt: {
    type: Date,
    default: null
  },
  lastViewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // ✅ handles createdAt & updatedAt safely
});

proposalSchema.index({ user: 1, createdAt: -1 });
proposalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
