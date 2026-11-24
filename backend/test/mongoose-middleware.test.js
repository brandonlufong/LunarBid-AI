// backend/test/mongoose-middleware.test.js
// Regression guard: Mongoose 9 dropped callback-style (`next`) middleware. A hook written as
// `schema.pre('save', function (next) { ... next(); })` throws `TypeError: next is not a function`
// at runtime (this broke POST /api/support/tickets with a 500). Hooks must be sync (no args) or
// async (return a Promise). This test fails if any pre/post hook declares a `next` parameter.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['models', 'routes', 'services', 'middleware'];

function jsFiles(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? jsFiles(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []
  );
}

// Matches: .pre('save', function (next)  /  .post("save", async function(next)  /  arrow (next) =>
const CALLBACK_HOOK = /\.(pre|post)\s*\(\s*['"][^'"]+['"]\s*,\s*(async\s*)?(function\s*)?\(\s*next\b/;

test('no Mongoose middleware uses the removed `next` callback signature', () => {
  const offenders = [];
  for (const dir of DIRS) {
    for (const rel of jsFiles(dir)) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      src.split('\n').forEach((line, i) => {
        if (CALLBACK_HOOK.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
      });
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Mongoose 9 rejects \`next\`-callback hooks (TypeError: next is not a function). ` +
      `Rewrite as sync \`function () {}\` or \`async function () {}\`:\n` + offenders.join('\n')
  );
});
