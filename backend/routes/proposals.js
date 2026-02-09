// backend/routes/proposals.js
const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateProposal } = require('../services/aiService');
const ProposalAnalytics = require('../models/ProposalAnalytics');

// ===============================
// Generate proposal
// ===============================
router.post('/generate', auth, async (req, res) => {
  try {
    const { jobTitle, jobDescription, clientName, budget, tone, length } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ message: 'Job title and description are required' });
    }

    // Load full user with methods
    const user = await User.findById(req.user._id);
    
    // Check if user can generate proposal
    const canGenerate = user.canGenerateProposal();
    
    if (!canGenerate.allowed) {
      return res.status(403).json({ 
        message: canGenerate.reason === 'daily_limit' 
          ? `Daily limit of ${canGenerate.limit} proposals reached. Upgrade or wait until tomorrow.`
          : `Monthly limit of ${canGenerate.limit} proposals reached. Upgrade for unlimited access.`,
        reason: canGenerate.reason,
        limit: canGenerate.limit,
        currentPlan: user.subscription.plan,
        usage: {
          today: user.usage.proposalsToday,
          thisMonth: user.usage.proposalsThisMonth
        }
      });
    }

    const toneDescriptions = {
      formal: 'highly professional and formal, suitable for corporate clients',
      friendly: 'warm and approachable while remaining professional',
      persuasive: 'compelling and results-focused, highlighting unique value propositions'
    };

    const lengthInstructions = {
      short: 'Create a concise 100-200 word proposal',
      medium: 'Create a comprehensive 200-400 word proposal',
      detailed: 'Create an in-depth 400-1000 word proposal with detailed roadmap'
    };

    // Determine AI priority based on plan
    const isPriorityAI = user.subscription.plan === 'pro';

    const prompt = `Generate a ${isPriorityAI ? 'comprehensive and detailed' : 'professional'} freelance proposal:

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Client Name: ${clientName || 'Hiring Manager'}
Budget: ${budget || 'To be discussed'}

Freelancer Profile:
Name: ${user.name}
Role: ${user.profile?.role || 'Professional Freelancer'}
Experience: ${user.profile?.experience || 'Professional freelancer with proven track record'}
Skills: ${user.profile?.skills || 'Versatile and skilled professional'}
Hourly Rate: ${user.profile?.hourlyRate || 'Competitive rates'}
Portfolio: ${user.profile?.portfolio || 'Available upon request'}
${user.profile?.bio ? `Bio: ${user.profile.bio}` : ''}

Tone: ${toneDescriptions[tone] || toneDescriptions.friendly}
Length: ${lengthInstructions[length] || lengthInstructions.medium}
Quality: ${isPriorityAI ? 'Premium - include specific examples and detailed approach' : 'Professional'}

Create a proposal that:
1. Opens with a personalized greeting (No "Dear Sir/Madam")
2. Shows clear understanding of the client's needs with natural human tone
3. Highlights relevant experience and skills
4. Avoids generic phrases, buzzwords, clichés, emojis, AI disclaimers
5. Outlines your approach and methodology
6. Mentions timeline and availability
7. Includes a clear value proposition
8. Ends with a strong call-to-action

Make it specific, natural, personalized and professional. Write as if you are ${user.name}.`;

    // Use AI service with automatic fallback
    let generatedProposal;
    
    try {
      generatedProposal = await generateProposal(prompt, isPriorityAI);
    } catch (aiError) {
      console.error('All AI providers failed:', aiError.message);
      // Use fallback template if all AI services fail
      generatedProposal = generateFallbackProposal(req.body, user);
    }

    if (!generatedProposal) {
      return res.status(500).json({ message: 'Failed to generate proposal text' });
    }

    // Save proposal to database
    const proposal = new Proposal({
      user: user._id,
      jobTitle,
      jobDescription,
      clientName,
      budget,
      tone,
      length,
      generatedProposal,
      status: 'draft'
    });

    await proposal.save();

    // After creating proposal:
    const analytics = new ProposalAnalytics({
      user: user._id,
      proposal: proposal._id,
      jobTitle: proposal.jobTitle,
      clientName: proposal.clientName,
      toneUsed: proposal.tone,
      styleUsed: proposal.length,
      proposalLength: proposal.generatedProposal.split(' ').length,
      dateCreated: new Date(),
      metadata: {
        isPriorityAI: user.hasFeatureAccess('priorityAI')
      }
    });

    await analytics.save();

    // Increment usage counters
    user.incrementUsage();
    await user.save();

    res.json({
      id: proposal._id,
      proposal: generatedProposal,
      createdAt: proposal.createdAt,
      usage: {
        today: user.usage.proposalsToday,
        thisMonth: user.usage.proposalsThisMonth,
        plan: user.subscription.plan
      }
    });

  } catch (error) {
    console.error('Error generating proposal:', error.message);
    res.status(500).json({ message: 'Server error while generating proposal' });
  }
});

// ===============================
// Fallback proposal generator
// ===============================
function generateFallbackProposal(data, user) {
  const { jobTitle, clientName, budget } = data;

  return `Dear ${clientName || 'Hiring Manager'},

Thank you for considering me for the ${jobTitle} position. I am excited about the opportunity to contribute to your project.

I have carefully reviewed your requirements and believe my experience as a ${user.profile?.role || 'professional freelancer'} makes me a strong fit for this role.

My approach focuses on:
• Clear and consistent communication throughout the project
• Timely delivery that respects your deadlines
• High-quality results tailored to your specific goals
• Ongoing collaboration to ensure your vision is realized

With ${user.profile?.experience || 'extensive experience in the field'}, I bring valuable expertise in ${user.profile?.skills || 'the required areas'}.

Timeline & Availability:
I am available to start immediately and can align with your project timeline to ensure smooth progress.

Investment:
${budget ? `I understand your budget of ${budget} and will ensure you receive excellent value for your investment.` : 'I am happy to discuss pricing based on the project scope and deliverables.'}

I would love the opportunity to discuss your project in more detail and answer any questions you may have.

Looking forward to working together!

Best regards,
${user.name}`;
}

// ===============================
// Update proposal (for editing)
// ===============================
router.put('/:id', auth, async (req, res) => {
  try {
    const { editedProposal, status } = req.body;

    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        editedProposal: editedProposal || undefined,
        status: status || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({
      message: 'Proposal updated successfully',
      proposal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Send proposal (mark as sent)
// ===============================
router.post('/:id/send', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status: 'sent',
        isSent: true,
        sentAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({
      message: 'Proposal sent successfully',
      proposal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get proposal history
// ===============================
router.get('/history', auth, async (req, res) => {
  try {
    const { status, sort = 'newest' } = req.query;
    
    let query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'recent-update') {
      sortOption = { updatedAt: -1 };
    }

    const proposals = await Proposal.find(query)
      .sort(sortOption)
      .limit(100);

    res.json(proposals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get single proposal
// ===============================
router.get('/:id', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json(proposal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Update proposal status
// ===============================
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'sent', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({
      message: 'Status updated successfully',
      proposal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Delete proposal
// ===============================
router.delete('/:id', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;