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
