// backend/routes/proposals.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const { generateProposal, generateJSON } = require('../services/aiService');
const { buildProposalPrompt, buildAnalysisPrompt, buildTemplateProposal } = require('../services/prompts');
const { reserve } = require('../services/usage');
const ProposalAnalytics = require('../models/ProposalAnalytics');
const { aiLimiter, publicLimiter, sendLimiter } = require('../middleware/rateLimits');
const { sendMail, isConfigured: mailerConfigured } = require('../services/mailer');
const { proposalEmail } = require('../services/emails');
const { displayUrl } = require('../services/storage');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { TONES, LENGTHS, STATUSES, checkString, firstError } = require('../utils/validate');

// ===============================
// AI Job-Post Analyzer
// Extracts structured insight from a job description to help the user win.
// ===============================


router.post('/analyze', auth, requireVerifiedEmail, aiLimiter, async (req, res) => {
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

    // Analyses are metered per plan; the quota is reserved atomically before the AI call.
    const canAnalyze = await reserve(user, 'analysis');
    if (!canAnalyze.allowed) {
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
      analysis = await generateJSON(buildAnalysisPrompt({ jobTitle, jobDescription, profile: user.profile }), isPriorityAI);
    } catch (aiError) {
      console.error('Analyze failed:', aiError.message);
      await canAnalyze.release();
      return res.status(503).json({ message: 'Job analysis is temporarily unavailable. Please try again in a minute. This attempt was not counted.' });
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
      // null when the user has no profile to match against (shown as "add your profile")
      matchScore: analysis.matchScore == null || !isFinite(Number(analysis.matchScore))
        ? null
        : Math.max(0, Math.min(100, Math.round(Number(analysis.matchScore)))),
      matchReason: analysis.matchReason || ''
    };

    res.json({ analysis: result });
  } catch (error) {
    console.error('Error analyzing job:', error.message);
    res.status(500).json({ message: 'Server error while analyzing job post' });
  }
});

// ===============================
// Generate proposal
// ===============================
router.post('/generate', auth, requireVerifiedEmail, aiLimiter, async (req, res) => {
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
    
    // Reserve one proposal from the plan's quota (atomic, so simultaneous requests can't exceed it)
    const canGenerate = await reserve(user, 'proposal');
    
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

    // Determine AI priority based on plan feature (pro + agency)
    const isPriorityAI = user.hasFeatureAccess('priorityAI');

    // Only the profile details the user entered are used; nothing is invented.
    const prompt = buildProposalPrompt({
      jobTitle, jobDescription, clientName, budget, tone, length,
      name: user.name, profile: user.profile, isPriority: isPriorityAI,
    });

    // Use AI service with automatic fallback
    let generatedProposal;
    
    let usedFallback = false;
    try {
      generatedProposal = await generateProposal(prompt, isPriorityAI);
    } catch (aiError) {
      console.error('All AI providers failed:', aiError.message);
      // Every AI provider failed: return a template, clearly flagged, and don't count it.
      generatedProposal = buildTemplateProposal({ jobTitle, clientName, budget, name: user.name, profile: user.profile });
      usedFallback = true;
    }

    // A template fallback is not charged against the quota
    if (usedFallback) await canGenerate.release();

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
      .populate('user', 'name branding subscription');
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
        // Branding shows only while the author's plan includes it.
        branding: author.branding && author.hasFeatureAccess?.('customBranding')
          ? { ...(author.branding.toObject?.() || author.branding), logoUrl: displayUrl(author.branding.logoUrl) }
          : null
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
// Send a proposal to a client by email.
// Sent from LunarBid's address with Reply-To set to the freelancer, so replies go to them.
// The proposal also gets a share link, included in the email.
// ===============================
router.post('/:id/send', auth, requireVerifiedEmail, sendLimiter, async (req, res, next) => {
  try {
    const { recipientEmail, subject, message, content } = req.body;
    const to = typeof recipientEmail === 'string' ? recipientEmail.trim().toLowerCase() : '';
    const invalid = firstError(
      !EMAIL_RE.test(to) || to.length > 254 ? 'Enter a valid recipient email address' : null,
      checkString(subject, 'subject', { required: true, max: 150 }),
      checkString(message, 'message', { max: 2000 }),
      checkString(content, 'editedProposal')
    );
    if (invalid) return res.status(400).json({ message: invalid });

    if (!mailerConfigured()) {
      return res.status(503).json({
        message: 'Email sending is not set up yet. Copy the proposal or its share link and send it yourself.',
        notConfigured: true,
      });
    }

    const proposal = await Proposal.findOne({ _id: req.params.id, user: req.user._id });
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    // Send exactly what the user sees (they may have edited it on screen).
    if (typeof content === 'string' && content.trim()) proposal.editedProposal = content;
    if (!proposal.shareToken) proposal.shareToken = crypto.randomBytes(16).toString('hex');
    proposal.isPublic = true;

    const sender = req.user;
    const text = proposal.editedProposal || proposal.generatedProposal;
    const link = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/p/${proposal.shareToken}`;
    const email = proposalEmail({ senderName: sender.name, subject: subject.trim(), message, text, link });

    const result = await sendMail({ to, subject: subject.trim(), html: email.html, text: email.text, replyTo: sender.email });
    if (!result.sent) {
      return res.status(502).json({ message: 'The email could not be sent. Please try again in a moment.' });
    }

    proposal.status = 'sent';
    proposal.isSent = true;
    proposal.sentAt = new Date();
    proposal.updatedAt = new Date();
    await proposal.save();

    res.json({ message: 'Proposal sent', proposal, sentTo: to, shareUrl: link });
  } catch (error) {
    next(error);
  }
});

// ===============================
// Get proposal history
// ===============================
router.get('/history', auth, async (req, res, next) => {
  try {
    // Newest first, 20 per page. Pass the returned nextCursor to get the next page.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const query = { user: req.user._id };
    if (req.query.status && STATUSES.includes(req.query.status)) query.status = req.query.status;
    if (req.query.cursor) {
      if (!/^[a-f0-9]{24}$/i.test(req.query.cursor)) return res.status(400).json({ message: 'Invalid cursor' });
      query._id = { $lt: req.query.cursor };
    }

    const rows = await Proposal.find(query).sort({ _id: -1 }).limit(limit + 1);
    const items = rows.slice(0, limit);
    res.json({ items, nextCursor: rows.length > limit ? String(items[items.length - 1]._id) : null });
  } catch (error) {
    next(error);
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
