// backend/routes/proposals.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateProposal, generateJSON } = require('../services/aiService');
const ProposalAnalytics = require('../models/ProposalAnalytics');
const { aiLimiter, publicLimiter } = require('../middleware/rateLimits');
const { TONES, LENGTHS, STATUSES, checkString, firstError } = require('../utils/validate');

// ===============================
// AI Job-Post Analyzer
// Extracts structured insight from a job description to help the user win.
// ===============================
const analyzePrompt = (jobDescription, jobTitle, user) => `You are an expert freelance bidding strategist. Analyze the following job post and return ONLY a JSON object (no prose, no markdown) matching this exact TypeScript shape:

{
  "summary": string,                 // 1-2 sentence plain-language summary of what the client wants
  "keyRequirements": string[],       // 3-6 concrete must-have requirements
  "suggestedSkills": string[],       // 3-8 skills/technologies to emphasize
  "clientPainPoints": string[],      // 2-4 underlying problems the client is really trying to solve
  "suggestedTone": "formal" | "friendly" | "persuasive",
  "suggestedLength": "short" | "medium" | "detailed",
  "complexity": "low" | "medium" | "high",
  "estimatedBudgetRange": string,    // e.g. "$800 - $1,500" (infer from scope if none given)
  "redFlags": string[],              // 0-4 warning signs (vague scope, low budget, scope creep risk...) — [] if none
  "winningAngles": string[],         // 2-4 specific angles/hooks to stand out from other bidders
  "matchScore": number,              // 0-100, how well this freelancer's profile fits the job
  "matchReason": string              // 1 sentence explaining the score
}

Job Title: ${jobTitle || '(not provided)'}
Job Description:
"""
${jobDescription}
"""

Freelancer profile (for matchScore):
Role: ${user.profile?.role || 'General freelancer'}
Skills: ${user.profile?.skills || 'Not specified'}
Experience: ${user.profile?.experience || 'Not specified'}

Return only the JSON object.`;

router.post('/analyze', auth, aiLimiter, async (req, res) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    const invalid = firstError(
      checkString(jobDescription, 'jobDescription', { required: true, min: 20 }),
      checkString(jobTitle, 'jobTitle')
    );
    if (invalid) {
      return res.status(400).json({ message: invalid });
    }

    const user = await User.findById(req.user._id);

    // Analyses are metered per plan, like proposals.
    const canAnalyze = user.canAnalyze();
    if (!canAnalyze.allowed) {
      await user.save(); // persist a daily counter reset, if one happened
      return res.status(403).json({
        message: `You have used all ${canAnalyze.limit} job analyses for today on your plan.`,
        reason: canAnalyze.reason,
        limit: canAnalyze.limit,
        currentPlan: user.effectivePlan(),
      });
    }

    const isPriorityAI = user.hasFeatureAccess('priorityAI');

    let analysis;
    try {
      analysis = await generateJSON(analyzePrompt(jobDescription, jobTitle, user), isPriorityAI);
    } catch (aiError) {
      console.error('Analyze failed:', aiError.message);
      return res.status(502).json({ message: 'Could not analyze this job post. Please try again.' });
    }

    // Normalize / clamp
    const clampEnum = (v, allowed, def) => (allowed.includes(v) ? v : def);
    const result = {
      summary: analysis.summary || '',
      keyRequirements: Array.isArray(analysis.keyRequirements) ? analysis.keyRequirements.slice(0, 8) : [],
      suggestedSkills: Array.isArray(analysis.suggestedSkills) ? analysis.suggestedSkills.slice(0, 12) : [],
      clientPainPoints: Array.isArray(analysis.clientPainPoints) ? analysis.clientPainPoints.slice(0, 6) : [],
      suggestedTone: clampEnum(analysis.suggestedTone, ['formal', 'friendly', 'persuasive'], 'friendly'),
      suggestedLength: clampEnum(analysis.suggestedLength, ['short', 'medium', 'detailed'], 'medium'),
      complexity: clampEnum(analysis.complexity, ['low', 'medium', 'high'], 'medium'),
      estimatedBudgetRange: analysis.estimatedBudgetRange || 'N/A',
      redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags.slice(0, 5) : [],
      winningAngles: Array.isArray(analysis.winningAngles) ? analysis.winningAngles.slice(0, 5) : [],
      matchScore: Math.max(0, Math.min(100, Number(analysis.matchScore) || 0)),
      matchReason: analysis.matchReason || ''
    };

    user.incrementAnalysis();
    await user.save();

    res.json({ analysis: result });
  } catch (error) {
    console.error('Error analyzing job:', error.message);
    res.status(500).json({ message: 'Server error while analyzing job post' });
  }
});

// ===============================
// Generate proposal
// ===============================
router.post('/generate', auth, aiLimiter, async (req, res) => {
  try {
    const { jobTitle, jobDescription, clientName, budget, tone, length } = req.body;

    const invalid = firstError(
      checkString(jobTitle, 'jobTitle', { required: true }),
      checkString(jobDescription, 'jobDescription', { required: true, min: 20 }),
      checkString(clientName, 'clientName'),
      checkString(budget, 'budget'),
      tone && !TONES.includes(tone) ? 'tone is not valid' : null,
      length && !LENGTHS.includes(length) ? 'length is not valid' : null
    );
    if (invalid) {
      return res.status(400).json({ message: invalid });
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
        currentPlan: user.effectivePlan(),
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

    // Determine AI priority based on plan feature (pro + agency)
    const isPriorityAI = user.hasFeatureAccess('priorityAI');

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
    
    let usedFallback = false;
    try {
      generatedProposal = await generateProposal(prompt, isPriorityAI);
    } catch (aiError) {
      console.error('All AI providers failed:', aiError.message);
      // Every AI provider failed: return a template, clearly flagged, and don't count it.
      generatedProposal = generateFallbackProposal(req.body, user);
      usedFallback = true;
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

    // Increment usage counters (a template fallback is not charged against the quota)
    if (!usedFallback) {
      user.incrementUsage();
      await user.save();
    }

    res.json({
      id: proposal._id,
      proposal: generatedProposal,
      isTemplate: usedFallback,
      createdAt: proposal.createdAt,
      usage: {
        today: user.usage.proposalsToday,
        thisMonth: user.usage.proposalsThisMonth,
        plan: user.effectivePlan()
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
// Create / return a public share link
// ===============================
router.post('/:id/share', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, user: req.user._id });
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (!proposal.shareToken) {
      proposal.shareToken = crypto.randomBytes(16).toString('hex');
    }
    proposal.isPublic = true;
    await proposal.save();
    res.json({ shareToken: proposal.shareToken, isPublic: true });
  } catch (error) {
    console.error('Share error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Revoke a public share link
// ===============================
router.post('/:id/unshare', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isPublic: false },
      { new: true }
    );
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    res.json({ isPublic: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// PUBLIC: view a shared proposal (NO auth). Must precede GET /:id.
// ===============================
router.get('/public/:token', publicLimiter, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ shareToken: req.params.token, isPublic: true })
      .populate('user', 'name branding');
    if (!proposal) return res.status(404).json({ message: 'This proposal link is not available.' });

    // Track views (best-effort)
    proposal.viewCount += 1;
    if (!proposal.firstViewedAt) proposal.firstViewedAt = new Date();
    proposal.lastViewedAt = new Date();
    await proposal.save();

    const author = proposal.user || {};
    res.json({
      jobTitle: proposal.jobTitle,
      clientName: proposal.clientName,
      content: proposal.editedProposal || proposal.generatedProposal,
      createdAt: proposal.createdAt,
      author: {
        name: author.name || 'A LunarBid user',
        branding: author.branding || null
      }
    });
  } catch (error) {
    console.error('Public view error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Update proposal (for editing)
// ===============================
router.put('/:id', auth, async (req, res) => {
  try {
    const { editedProposal, status } = req.body;
    const invalid = firstError(
      checkString(editedProposal, 'editedProposal'),
      status && !STATUSES.includes(status) ? 'status is not valid' : null
    );
    if (invalid) {
      return res.status(400).json({ message: invalid });
    }

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
    const { recipientEmail, subject, message } = req.body;

    if (!recipientEmail || !subject ) {
      return res.status(400).json({ message: 'Recipient email and subject are required or Proposal already sent' });
    }

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

    // TODO: Integrate with email service (SendGrid, Nodemailer, etc.)
    // For now, just mark as sent and log the details
    console.log('Proposal sent to:', recipientEmail);
    console.log('Subject:', subject);
    console.log('status:', proposal.status);
    console.log('Sent?', proposal.isSent);
    if (message) {
      console.log('Message:', message);
    }

    res.json({
      message: 'Proposal sent successfully',
      proposal,
      sentTo: recipientEmail,
      subject
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

// const express = require('express');
// const router = express.Router();
// const Proposal = require('../models/Proposal');
// const ProposalAnalytics = require('../models/ProposalAnalytics');
// const User = require('../models/User');
// const auth = require('../middleware/auth');
// const { generateProposal } = require('../services/aiService');

// /* ======================================================
//    GENERATE PROPOSAL
// ====================================================== */
// router.post('/generate', auth, async (req, res) => {
//   try {
//     const { jobTitle, jobDescription, clientName, budget, tone, length } = req.body;

//     if (!jobTitle || !jobDescription) {
//       return res.status(400).json({ message: 'Job title and description are required' });
//     }

//     const user = await User.findById(req.user._id);

//     const canGenerate = user.canGenerateProposal();
//     if (!canGenerate.allowed) {
//       return res.status(403).json({
//         message: `Limit reached (${canGenerate.limit})`,
//         reason: canGenerate.reason
//       });
//     }

//     const isPriorityAI = user.hasFeatureAccess('priorityAI');

//     const prompt = `Generate a professional freelance proposal.

// Job Title: ${jobTitle}
// Job Description: ${jobDescription}
// Client: ${clientName || 'Hiring Manager'}
// Budget: ${budget || 'Flexible'}

// Tone: ${tone || 'friendly'}
// Length: ${length || 'medium'}
// Quality: ${isPriorityAI ? 'Premium' : 'Standard'}

// Write naturally and professionally.`;

//     let generatedProposal;
//     try {
//       generatedProposal = await generateProposal(prompt, isPriorityAI);
//     } catch {
//       generatedProposal = fallbackProposal(req.body, user);
//     }

//     const proposal = await Proposal.create({
//       user: user._id,
//       jobTitle,
//       jobDescription,
//       clientName,
//       budget,
//       tone,
//       length,
//       generatedProposal
//     });

//     await ProposalAnalytics.create({
//       user: user._id,
//       proposal: proposal._id,
//       jobTitle,
//       clientName,
//       toneUsed: tone,
//       styleUsed: length,
//       proposalLength: generatedProposal.split(' ').length,
//       metadata: {
//         isPriorityAI
//       }
//     });

//     user.incrementUsage();
//     await user.save();

//     res.json({ proposal });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to generate proposal' });
//   }
// });

// /* ======================================================
//    UPDATE PROPOSAL (SAFE)
// ====================================================== */
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const { editedProposal, status } = req.body;

//     const update = {};

//     if (editedProposal !== undefined) {
//       update.editedProposal = editedProposal;
//     }

//     if (status !== undefined) {
//       update.status = status;
//     }

//     const proposal = await Proposal.findOneAndUpdate(
//       { _id: req.params.id, user: req.user._id },
//       update,
//       { new: true }
//     );

//     if (!proposal) {
//       return res.status(404).json({ message: 'Proposal not found' });
//     }

//     res.json({ proposal });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Update failed' });
//   }
// });

// /* ======================================================
//    SEND PROPOSAL (AUTHORITATIVE)
// ====================================================== */
// router.post('/:id/send', auth, async (req, res) => {
//   try {
//     const proposal = await Proposal.findOne({
//       _id: req.params.id,
//       user: req.user._id
//     });

//     if (!proposal) {
//       return res.status(404).json({ message: 'Proposal not found' });
//     }

//     if (proposal.isSent) {
//       return res.status(400).json({ message: 'Proposal already sent' });
//     }

//     proposal.status = 'sent';
//     proposal.isSent = true;
//     proposal.sentAt = new Date();

//     await proposal.save();

//     console.log('Proposal sent:', proposal._id);

//     res.json({ proposal });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Send failed' });
//   }
// });

// /* ======================================================
//    HISTORY
// ====================================================== */
// router.get('/history', auth, async (req, res) => {
//   const proposals = await Proposal.find({ user: req.user._id })
//     .sort({ createdAt: -1 });

//   res.json(proposals);
// });

// /* ======================================================
//    SINGLE
// ====================================================== */
// router.get('/:id', auth, async (req, res) => {
//   const proposal = await Proposal.findOne({
//     _id: req.params.id,
//     user: req.user._id
//   });

//   if (!proposal) {
//     return res.status(404).json({ message: 'Not found' });
//   }

//   res.json(proposal);
// });

// /* ======================================================
//    DELETE
// ====================================================== */
// router.delete('/:id', auth, async (req, res) => {
//   await Proposal.findOneAndDelete({
//     _id: req.params.id,
//     user: req.user._id
//   });

//   res.json({ message: 'Deleted' });
// });

// /* ======================================================
//    FALLBACK
// ====================================================== */
// function fallbackProposal(data, user) {
//   return `Hello,

// I’m interested in the ${data.jobTitle} role and confident I can deliver value.

// Best regards,
// ${user.name}`;
// }

// module.exports = router;
