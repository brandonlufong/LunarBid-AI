// backend/services/prompts.js
// ============================================================================
// Prompts for the job analyzer and proposal writer.
//
// Honesty rules:
//  - Only profile details the user actually entered are sent. Empty fields are
//    left out, never replaced with invented phrases like "proven track record".
//  - The model is told not to invent experience, clients, results or numbers.
//  - The job post is wrapped in <job_post> tags and treated as third-party data,
//    so instructions hidden inside it are not followed.
// ============================================================================

const PROFILE_FIELDS = [
  ['role', 'Role'],
  ['experience', 'Experience'],
  ['skills', 'Skills'],
  ['hourlyRate', 'Hourly rate'],
  ['portfolio', 'Portfolio'],
  ['bio', 'Bio'],
];

/** Profile lines for the fields the user filled in (empty array when none). */
function profileLines(profile = {}) {
  return PROFILE_FIELDS.filter(([key]) => typeof profile[key] === 'string' && profile[key].trim()).map(
    ([key, label]) => `${label}: ${profile[key].trim()}`
  );
}

/** True when the profile has something to match a job against. */
function hasProfile(profile = {}) {
  return profileLines(profile).some((l) => /^(Role|Experience|Skills|Bio):/.test(l));
}

// Strip our delimiters from user text so a job post can't close the tag early.
const fence = (text = '') => String(text).replace(/<\/?job_post>/gi, '');

const TONES = {
  formal: 'highly professional and formal, suitable for corporate clients',
  friendly: 'warm and approachable while remaining professional',
  persuasive: 'compelling and results-focused, highlighting the value to the client',
};
const LENGTHS = {
  short: 'a concise proposal of 100-200 words',
  medium: 'a proposal of 200-400 words',
  detailed: 'an in-depth proposal of 400-1000 words with a clear, step-by-step plan',
};

function buildProposalPrompt({ jobTitle, jobDescription, clientName, budget, tone, length, name, profile, isPriority }) {
  const lines = profileLines(profile);
  const profileBlock = lines.length
    ? lines.join('\n')
    : '(The freelancer has not added profile details yet.)';

  return `Write ${LENGTHS[length] || LENGTHS.medium} for this freelance job, in a tone that is ${TONES[tone] || TONES.friendly}.

<job_post>
Title: ${fence(jobTitle)}
${fence(jobDescription)}
</job_post>

Client name: ${clientName ? fence(clientName) : 'not given (use a natural greeting without a name)'}
Client budget: ${budget ? fence(budget) : 'not given'}

Freelancer: ${name}
${profileBlock}

Rules:
1. Mention only experience, skills, portfolio, rates and credentials that appear in the freelancer details above. Do not invent years of experience, past clients, results, statistics or qualifications.
2. If the freelancer details are thin, focus on understanding the client's needs, a concrete approach, and good questions to ask, instead of claims about the freelancer.
3. Open with a personalized greeting (never "Dear Sir/Madam") and show you understood what the client actually needs.
4. Outline the approach${isPriority ? ' in detail, with clear steps and milestones' : ''}, and mention availability and next steps.
5. No buzzwords, clichés, emojis, placeholders in brackets, or statements about being an AI.
6. End with a clear, friendly call to action.

Write in the first person as ${name}. Output only the proposal text.`;
}

function buildAnalysisPrompt({ jobTitle, jobDescription, profile }) {
  const lines = profileLines(profile);
  const scoring = hasProfile(profile)
    ? `Freelancer profile (for matchScore):\n${lines.join('\n')}`
    : 'The freelancer has no profile details yet: set "matchScore" to null and "matchReason" to "".';

  return `You are an expert freelance bidding strategist. Analyze the job post below and return ONLY a JSON object (no prose, no markdown) with exactly this shape:

{
  "summary": string,                 // 1-2 sentence plain-language summary of what the client wants
  "keyRequirements": string[],       // 3-6 concrete must-have requirements
  "suggestedSkills": string[],       // 3-8 skills/technologies to emphasize
  "clientPainPoints": string[],      // 2-4 underlying problems the client is really trying to solve
  "suggestedTone": "formal" | "friendly" | "persuasive",
  "suggestedLength": "short" | "medium" | "detailed",
  "complexity": "low" | "medium" | "high",
  "estimatedBudgetRange": string,    // e.g. "$800 - $1,500" (infer from scope if none given)
  "redFlags": string[],              // 0-4 warning signs (vague scope, low budget, scope creep risk...) or []
  "winningAngles": string[],         // 2-4 specific angles to stand out from other bidders
  "matchScore": number | null,       // 0-100, how well the freelancer's profile fits the job
  "matchReason": string              // 1 sentence explaining the score
}

<job_post>
Title: ${jobTitle ? fence(jobTitle) : '(not provided)'}
${fence(jobDescription)}
</job_post>

${scoring}

Return only the JSON object.`;
}

/**
 * Last-resort proposal when every AI provider is unavailable. Uses only details
 * the user provided; it is flagged as a template in the API response and the UI.
 */
function buildTemplateProposal({ jobTitle, clientName, budget, name, profile = {} }) {
  const role = profile.role?.trim();
  const skills = profile.skills?.trim();
  const experience = profile.experience?.trim();
  const about = [
    role && `I work as a ${role}`,
    experience && `${experience}`,
    skills && `my core skills include ${skills}`,
  ].filter(Boolean);

  return `Hi ${clientName || 'there'},

Thank you for posting "${jobTitle}". I have read through your requirements and would like to help.

${about.length ? `${about.join('; ')}.\n\n` : ''}Here is how I would approach it:
• Confirm the scope, priorities and success criteria with you at the start
• Share progress regularly so you always know where things stand
• Deliver in clear stages, with time for your feedback along the way

${budget ? `I have noted your budget of ${budget} and am happy to discuss how best to use it.` : 'I am happy to discuss pricing once we have agreed the scope and deliverables.'}

Could we have a short call to go over the details? I would be glad to answer any questions.

Best regards,
${name}`;
}

module.exports = { buildProposalPrompt, buildAnalysisPrompt, buildTemplateProposal, profileLines, hasProfile };
