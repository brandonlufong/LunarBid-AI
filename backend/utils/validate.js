// Small request-validation helpers. Returns an error message, or null when valid.
// Limits keep AI prompts (and costs) bounded and stop oversized documents.
const LIMITS = {
  jobTitle: 200,
  jobDescription: 8000,
  clientName: 120,
  budget: 60,
  editedProposal: 20000,
};

const TONES = ['formal', 'friendly', 'persuasive'];
const LENGTHS = ['short', 'medium', 'detailed'];
const STATUSES = ['draft', 'sent', 'accepted', 'rejected'];

function checkString(value, field, { required = false, min = 0, max = LIMITS[field] } = {}) {
  if (value === undefined || value === null || value === '') {
    return required ? `${field} is required` : null;
  }
  if (typeof value !== 'string') return `${field} must be text`;
  const len = value.trim().length;
  if (required && len < Math.max(min, 1)) return min > 1 ? `${field} must be at least ${min} characters` : `${field} is required`;
  if (max && value.length > max) return `${field} must be at most ${max} characters`;
  return null;
}

function firstError(...checks) {
  return checks.find(Boolean) || null;
}

module.exports = { LIMITS, TONES, LENGTHS, STATUSES, checkString, firstError };

// ---------- field allow-lists ----------
// Only these fields can be set from requests; everything else (owner, team, counters,
// timestamps) is controlled by the server.

const PROFILE_LIMITS = { role: 100, experience: 2000, skills: 500, hourlyRate: 50, portfolio: 300, bio: 2000 };
const PROFILE_TONES = ['Professional', 'Friendly', 'Persuasive'];
const PLATFORMS = ['Upwork', 'Fiverr', 'Freelancer'];

/** Validate a profile update. Returns { error } or { update } with only the fields sent. */
function pickProfile(body = {}) {
  const update = {};
  for (const [field, max] of Object.entries(PROFILE_LIMITS)) {
    if (body[field] === undefined) continue;
    const err = checkString(body[field] ?? '', field, { max });
    if (err) return { error: err };
    update[field] = (body[field] ?? '').trim();
  }
  if (body.preferredTone !== undefined) {
    if (!PROFILE_TONES.includes(body.preferredTone)) return { error: 'preferredTone is not valid' };
    update.preferredTone = body.preferredTone;
  }
  if (body.platformFocus !== undefined) {
    if (!Array.isArray(body.platformFocus) || body.platformFocus.some((p) => !PLATFORMS.includes(p))) {
      return { error: 'platformFocus is not valid' };
    }
    update.platformFocus = [...new Set(body.platformFocus)];
  }
  return { update };
}

const CLIENT_LIMITS = { profileName: 100, companyName: 150, industry: 100, contactPerson: 100, email: 254, phone: 40, preferredTone: 40, preferredStyle: 40, notes: 5000 };

/** Validate client-profile fields. `requireName` for creation. Returns { error } or { fields }. */
function pickClientProfile(body = {}, { requireName = false } = {}) {
  const fields = {};
  for (const [field, max] of Object.entries(CLIENT_LIMITS)) {
    if (body[field] === undefined) continue;
    const err = checkString(body[field] ?? '', field, { max });
    if (err) return { error: err };
    fields[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
  }
  if (requireName && !fields.profileName) return { error: 'Profile name is required' };
  if (fields.profileName === '') return { error: 'Profile name is required' };
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return { error: 'email is not valid' };
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 20 || body.tags.some((t) => typeof t !== 'string' || t.length > 40)) {
      return { error: 'tags must be up to 20 short labels' };
    }
    fields.tags = body.tags.map((t) => t.trim()).filter(Boolean);
  }
  if (body.isFavorite !== undefined) fields.isFavorite = !!body.isFavorite;
  return { fields };
}

module.exports.pickProfile = pickProfile;
module.exports.pickClientProfile = pickClientProfile;
