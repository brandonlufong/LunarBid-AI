# LunarBid — Phase 2: must-fix before launch (P1)

Tests: `cd backend && npm test` → 35 passing (16 Phase 1 + 19 Phase 2). Frontend: `npm run lint` has 0 errors; `npm run build` passes. Automated accessibility check (axe) on 12 screens: 0 violations.

## AI: honest and reliable
- **No invented experience (AI-2).** Only the profile details a user entered are sent to the AI; empty fields are left out instead of becoming "proven track record" or "competitive rates". The prompt forbids inventing experience, clients, results or numbers. Job posts are fenced in `<job_post>` tags so instructions hidden inside them are ignored. With no profile, the analyzer shows "Add your profile to get a match score" instead of a made-up percentage. (`backend/services/prompts.js`)
- **Reliable fallback (AI-4, AI-5).** One provider table with a per-provider timeout (25 s) and a whole-request deadline (45 s); a provider that fails 3 times is skipped for 2 minutes. Models, order and timeouts are configurable (`*_MODEL`, `AI_PROVIDER_ORDER`, `AI_TIMEOUT_MS`, `AI_DEADLINE_MS`). New `npm run ai:check` tests every configured provider. The Groq SDK dependency was removed. (`backend/services/aiService.js`)
- **Clear waiting (UX-6).** Generation shows progress stages and, after 20 s, explains it is switching to a backup provider.

## Proposals are really sent (UX-1)
- Emails the client from LunarBid's address with **Reply-To = the freelancer**, the personal message, the proposal and a "View online" link. Sends exactly what is on screen, including unsaved edits.
- All user text is HTML-escaped; limit of 30 sends per user per day (`SEND_LIMIT_PER_DAY`). If email isn't configured it says so instead of pretending.
- Support-ticket emails are escaped too (SEC-10).

## Your data (API-3)
- Profile → **Your data**: export everything as JSON (no secrets), or delete the account. Deletion needs the password (or the email for Google/GitHub accounts), cancels any Stripe subscription immediately, and removes proposals, clients, analytics, tickets, logo and account.

## Uploads (SEC-6, UX-5, DEP-5)
- Logos are checked by file content: PNG, JPEG or WebP only, 2 MB max. SVG and disguised files are rejected.
- Storage works with any S3-compatible bucket (`S3_*` variables), or local disk in development. Logos now use full URLs, so they actually display.
- Shared proposals show branding only while the author's plan includes it.

## Sign-in (SEC-5)
- Google/GitHub sign-in checks a `state` value (blocks login CSRF), accepts only verified emails, and hands over a single-use 2-minute code instead of putting the session token in the URL.

## Validation and fixes (API-1)
- Length and format limits on profiles, client profiles, branding and support tickets; schema validators run on updates.
- **Security fix:** client-profile updates applied the whole request body, so a user could reassign a profile to another account. Only editable fields are accepted now.
- Profile fields can be cleared (an empty value used to keep the old one).

## Frontend fixes found along the way
- **14 API calls bypassed `VITE_API_URL`** (Analytics, Branding, Client profiles, Support, Dashboard plan) and would have failed in production. All now use the shared API client.
- **Support tickets never worked:** the form posted to a route that doesn't exist. Fixed.
- **Favoriting a client never worked:** it called an endpoint that doesn't exist. Now uses the update route.
- Lint: 0 errors (was 38).

## Accessibility (UX-4)
- All 49 form labels are linked to their fields; button groups are labelled; 12 icon-only buttons have spoken names, in English and French.

## Deployment (DEP-4, DEP-7, DEP-9, DEP-6, DEP-8)
- `netlify.toml` (frontend), `render.yaml` (API) and `backend/Dockerfile` (any container host).
- GitHub Actions CI (`.github/workflows/ci.yml`): backend tests, frontend lint and build on every push and pull request.
- SEO: description and social-sharing tags, LunarBid favicon, sharing image (`og-image.png`), `robots.txt`, `sitemap.xml`; shared proposals are marked `noindex`.
- **`DEPLOYMENT.md`**: step-by-step setup for MongoDB Atlas, R2 storage, transactional email (SPF/DKIM/DMARC), Render, Netlify, Stripe, Sentry, staging, backups and a launch checklist.

## New settings
Backend (`backend/.env.example`): `BACKEND_URL`, `S3_*`, `SEND_LIMIT_PER_DAY`, optional `AI_*` and `*_MODEL`.
Frontend: `VITE_API_URL` (required in production), `VITE_SENTRY_DSN`.

## Next (P2, after launch)
Session hardening (short-lived tokens, revocation), email verification, streaming AI output, code splitting (the bundle is ~1 MB), pagination for proposal history, localized server messages, cost dashboards, prerendering the landing page, and building team features before re-opening the Agency plan.
