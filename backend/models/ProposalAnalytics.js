const mongoose = require('mongoose');

const proposalAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  
  // Proposal Details
  jobTitle: String,
  clientName: String,
  clientProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile'
  },
  
  // Metrics
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'pending'],
    default: 'draft'
  },
  industry: String,
  proposalLength: Number,  // word count
  toneUsed: {
    type: String,
    enum: ['formal', 'friendly', 'persuasive']
  },
  styleUsed: {
    type: String,
    enum: ['short', 'medium', 'detailed']
  },
  
  // Dates
  dateCreated: {
    type: Date,
    default: Date.now
  },
  dateSubmitted: Date,
  dateResponded: Date,
  
  // Response Time (in hours)
  responseTime: {
    type: Number,
    default: null
  },
  
  // Financial
  proposedBudget: Number,
  actualRevenue: {
    type: Number,
    default: 0
  },
  
  // Performance
  viewCount: {
    type: Number,
    default: 0
  },
  editCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  metadata: {
    aiModel: String,
    generationTime: Number,  // milliseconds
    tokensUsed: Number,
    isPriorityAI: Boolean
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
proposalAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate response time if dates are set
  if (this.dateSubmitted && this.dateResponded && !this.responseTime) {
    const diff = this.dateResponded - this.dateSubmitted;
    this.responseTime = Math.round(diff / (1000 * 60 * 60)); // Convert to hours
  }
  
  next();
});

// Methods
proposalAnalyticsSchema.methods.markAsWon = function(revenue) {
  this.status = 'accepted';
  this.actualRevenue = revenue || 0;
  this.dateResponded = new Date();
};

proposalAnalyticsSchema.methods.markAsLost = function() {
  this.status = 'rejected';
  this.dateResponded = new Date();
};

// Statics for analytics queries
proposalAnalyticsSchema.statics.getWinRate = async function(userId, filters = {}) {
  const query = { user: userId, status: { $in: ['accepted', 'rejected'] } };
  
  if (filters.startDate) {
    query.dateSubmitted = { $gte: filters.startDate };
  }
  if (filters.endDate) {
    query.dateSubmitted = { ...query.dateSubmitted, $lte: filters.endDate };
  }
  
  const total = await this.countDocuments(query);
  const won = await this.countDocuments({ ...query, status: 'accepted' });
  
  return {
    total,
    won,
    lost: total - won,
    winRate: total > 0 ? ((won / total) * 100).toFixed(1) : 0
  };
};

proposalAnalyticsSchema.statics.getPerformanceByTone = async function(userId) {
  return await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: { $in: ['accepted', 'rejected'] } } },
    {
      $group: {
        _id: '$toneUsed',
        total: { $sum: 1 },
        won: {
          $sum: {
            $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        tone: '$_id',
        total: 1,
        won: 1,
        winRate: {
          $multiply: [
            { $divide: ['$won', '$total'] },
            100
          ]
        }
      }
    }
  ]);
};

proposalAnalyticsSchema.statics.getRevenueStats = async function(userId, filters = {}) {
  const query = { user: userId, status: 'accepted' };
  
  if (filters.startDate) {
    query.dateResponded = { $gte: filters.startDate };
  }
  if (filters.endDate) {
    query.dateResponded = { ...query.dateResponded, $lte: filters.endDate };
  }
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$actualRevenue' },
        avgRevenue: { $avg: '$actualRevenue' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalRevenue: 0, avgRevenue: 0, count: 0 };
};

// Indexes
proposalAnalyticsSchema.index({ user: 1, dateSubmitted: -1 });
proposalAnalyticsSchema.index({ user: 1, status: 1 });
proposalAnalyticsSchema.index({ team: 1, dateSubmitted: -1 });
proposalAnalyticsSchema.index({ clientProfile: 1 });

module.exports = mongoose.model('ProposalAnalytics', proposalAnalyticsSchema);