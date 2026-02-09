const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  maxMembers: {
    type: Number,
    default: 5  // Agency plan default
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    permissions: {
      createProposals: { type: Boolean, default: true },
      editProposals: { type: Boolean, default: true },
      deleteProposals: { type: Boolean, default: false },
      manageTeam: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: true },
      manageBranding: { type: Boolean, default: false }
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    inviteEmail: String,
    inviteToken: String,
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    }
  }],
  
  // Shared resources
  sharedResources: {
    templates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    }],
    clientProfiles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientProfile'
    }],
    brandingSettings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branding'
    }
  },
  
  // Team settings
  settings: {
    allowMembersToInvite: { type: Boolean, default: false },
    requireApprovalForProposals: { type: Boolean, default: false },
    sharedAnalytics: { type: Boolean, default: true },
    activityNotifications: { type: Boolean, default: true }
  },
  
  // Subscription info
  subscription: {
    plan: {
      type: String,
      enum: ['agency'],
      default: 'agency'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    }
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
teamSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Methods
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && 
    member.status === 'active'
  );
};

teamSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

teamSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString() && 
    m.status === 'active'
  );
  
  if (!member) return false;
  if (member.role === 'owner') return true;
  if (member.role === 'admin' && permission !== 'manageTeam') return true;
  
  return member.permissions[permission] || false;
};

teamSchema.methods.canAddMember = function() {
  const activeMembers = this.members.filter(m => m.status === 'active').length;
  return activeMembers < this.maxMembers;
};

// Indexes
teamSchema.index({ owner: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Team', teamSchema);