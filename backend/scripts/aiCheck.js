// Checks every configured AI provider with a tiny request and reports which ones work.
// Usage: npm run ai:check
require('dotenv').config();
const { configuredProviders } = require('../services/aiService');

(async () => {
  const providers = configuredProviders();
  if (!providers.length) {
    console.log('No AI providers configured. Add at least one key (see .env.example).');
    process.exit(1);
  }
  let ok = 0;
  for (const p of providers) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const { text } = await p.call({ key: p.key, model: p.model, prompt: 'Reply with the single word: ready', maxTokens: 10, signal: controller.signal });
      console.log(`OK    ${p.name.padEnd(12)} ${p.model}  (${Date.now() - started} ms) → "${text.slice(0, 20)}"`);
      ok++;
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      console.log(`FAIL  ${p.name.padEnd(12)} ${p.model}  ${err.response?.status || ''} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  console.log(`\n${ok}/${providers.length} providers working. Order used: ${providers.map((p) => p.id).join(' → ')}`);
  process.exit(ok ? 0 : 1);
})();
