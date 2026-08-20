// frontend/src/config/proposalTemplates.js
// Per-template icon + suggested tone/length. The text (label, jobTitle,
// jobDescription) lives in i18n at `dashboard.templates.items` (paired by index)
// so templates are localized. Keep this array in the same order as the i18n items.
export const TEMPLATE_META = [
  { icon: '💻', tone: 'friendly', length: 'medium' },   // Web / App Dev
  { icon: '🎨', tone: 'persuasive', length: 'short' },  // Logo & Branding
  { icon: '✍️', tone: 'friendly', length: 'medium' },   // Content Writing
  { icon: '🐛', tone: 'formal', length: 'short' },       // Bug Fix
  { icon: '📈', tone: 'persuasive', length: 'medium' },  // Marketing / SEO
  { icon: '🧭', tone: 'formal', length: 'detailed' },    // Consulting
];
