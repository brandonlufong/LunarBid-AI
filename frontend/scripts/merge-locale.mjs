// Deep-merge translation additions into src/locales/<lang>.js.
// Usage: node scripts/merge-locale.mjs <additions.json>   (JSON: { "en": {...}, "fr": {...} })
// Existing keys are overwritten only where the additions define them.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const additions = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const merge = (a, b) => {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v);
    else a[k] = v;
  }
  return a;
};
const header = { en: '// English translations', fr: '// French translations' };
for (const [lang, add] of Object.entries(additions)) {
  const file = path.resolve('src/locales', `${lang}.js`);
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  const merged = merge(structuredClone(mod[lang]), add);
  writeFileSync(file, `${header[lang] || ''}\nexport const ${lang} = ${JSON.stringify(merged, null, 2)};\n\nexport default ${lang};\n`);
  console.log(`${lang}: merged`);
}
