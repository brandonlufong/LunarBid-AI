const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer'); // You'll need to install this: npm install nodemailer

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'agency'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'feature_request', 'bug_report', 'general'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_reply', 'resolved', 'closed'],
    default: 'open'
  },
  responses: [{
    from: {
      type: String,
      enum: ['user', 'support'],
      required: true
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    staffName: String  // if from support
  }],
  assignedTo: {
    type: String,
    default: null
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
});

// Update timestamp on save
supportTicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Set priority based on plan
supportTicketSchema.pre('save', function(next) {
  if (this.isNew) {
    // Pro and Agency get higher priority
    if (this.subscriptionPlan === 'agency') {
      this.priority = 'urgent';
    } else if (this.subscriptionPlan === 'pro') {
      this.priority = 'high';
    }
  }
  next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

// Email transporter setup (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.SUPPORT_EMAIL_PASSWORD
  }
});

// SLA Response times by plan
const SLA_RESPONSE_TIMES = {
  free: '48 hours',
  starter: '24 hours',
  pro: '12 hours',
  agency: '4 hours'
};

// ===============================
// Create support ticket
// ===============================
router.post('/tickets', auth, async (req, res) => {
  try {
    const { category, subject, message } = req.body;
    
    if (!category || !subject || !message) {
      return res.status(400).json({ 
        message: 'Category, subject, and message are required' 
      });
    }
    
    const user = await User.findById(req.user._id);
    
    const ticket = new SupportTicket({
      user: user._id,
      email: user.email,
      name: user.name,
      subscriptionPlan: user.effectivePlan(),
      category,
      subject,
      message
    });
    
    await ticket.save();
    
    // Send confirmation email to user
    await sendTicketConfirmationEmail(ticket);
    
    // Notify support team
    await notifySupportTeam(ticket);
    
    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        expectedResponseTime: SLA_RESPONSE_TIMES[ticket.subscriptionPlan],
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get user's support tickets
// ===============================
router.get('/tickets', auth, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    let query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .select('-responses')  // Don't include full responses in list view
      .limit(50);
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get single ticket with responses
// ===============================
router.get('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Add response to ticket
// ===============================
router.post('/tickets/:id/responses', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    if (ticket.status === 'closed') {
      return res.status(400).json({ 
        message: 'Cannot add response to closed ticket' 
      });
    }
    
    ticket.responses.push({
      from: 'user',
      message
    });
    
    ticket.status = 'waiting_reply';
    await ticket.save();
    
    // Notify support team of new response
    await notifySupportTeam(ticket, true);
    
    res.json({
      message: 'Response added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Close ticket
// ===============================
router.patch('/tickets/:id/close', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { 
        status: 'closed',
        resolvedAt: new Date()
      },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json({
      message: 'Ticket closed successfully',
      ticket
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get support info (SLA, contact, etc.)
// ===============================
router.get('/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const plan = user.effectivePlan();
    
    const supportInfo = {
      plan,
      responseTime: SLA_RESPONSE_TIMES[plan],
      channels: getSupportChannels(plan),
      features: {
        emailSupport: true,
        priorityQueue: ['pro', 'agency'].includes(plan),
        phoneSupport: plan === 'agency',
        dedicatedManager: plan === 'agency'
      },
      contactEmail: process.env.SUPPORT_EMAIL || 'support@lunarbid.com',
      phoneNumber: plan === 'agency' ? process.env.SUPPORT_PHONE : null,
      liveChatAvailable: ['pro', 'agency'].includes(plan),
      knowledgeBaseUrl: 'https://help.lunarbid.com'
    };
    
    res.json(supportInfo);
  } catch (error) {
    console.error('Error fetching support info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Helper Functions
// ===============================

function getSupportChannels(plan) {
  const channels = ['email', 'ticket_system'];
  
  if (plan === 'pro' || plan === 'agency') {
    channels.push('live_chat', 'priority_queue');
  }
  
  if (plan === 'agency') {
    channels.push('phone', 'dedicated_manager');
  }
  
  return channels;
}

async function sendTicketConfirmationEmail(ticket) {
  try {
    const mailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: ticket.email,
      subject: `Support Ticket Created - #${ticket._id}`,
      html: `
        <h2>Support Ticket Created</h2>
        <p>Hi ${ticket.name},</p>
        <p>Thank you for contacting LunarBid support. We've received your request and will respond within ${SLA_RESPONSE_TIMES[ticket.subscriptionPlan]}.</p>
        
        <h3>Ticket Details:</h3>
        <ul>
          <li><strong>Ticket ID:</strong> #${ticket._id}</li>
          <li><strong>Subject:</strong> ${ticket.subject}</li>
          <li><strong>Category:</strong> ${ticket.category}</li>
          <li><strong>Priority:</strong> ${ticket.priority}</li>
          <li><strong>Status:</strong> ${ticket.status}</li>
        </ul>
        
        <p>You can view and manage your ticket in your account dashboard.</p>
        
        <p>Best regards,<br>LunarBid Support Team</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

async function notifySupportTeam(ticket, isUpdate = false) {
  try {
    const mailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: process.env.SUPPORT_TEAM_EMAIL || process.env.SUPPORT_EMAIL,
      subject: isUpdate 
        ? `[UPDATE] Support Ticket #${ticket._id} - ${ticket.priority.toUpperCase()}`
        : `[NEW] Support Ticket #${ticket._id} - ${ticket.priority.toUpperCase()}`,
      html: `
        <h2>${isUpdate ? 'Ticket Updated' : 'New Support Ticket'}</h2>
        <ul>
          <li><strong>Ticket ID:</strong> #${ticket._id}</li>
          <li><strong>Plan:</strong> ${ticket.subscriptionPlan.toUpperCase()}</li>
          <li><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</li>
          <li><strong>Category:</strong> ${ticket.category}</li>
          <li><strong>User:</strong> ${ticket.name} (${ticket.email})</li>
          <li><strong>Subject:</strong> ${ticket.subject}</li>
        </ul>
        
        <h3>Message:</h3>
        <p>${ticket.message}</p>
        
        <p><strong>Expected Response Time:</strong> ${SLA_RESPONSE_TIMES[ticket.subscriptionPlan]}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error notifying support team:', error);
  }
}

module.exports = router;