---
name: lunarbid-dev
description: Engineering playbook for the LunarBid AI proposal-generator SaaS (MERN). Load when working anywhere under F:\LunarBid — covers architecture, data models, plan/feature gating, the theme + i18n systems, known bugs, conventions, and the improvement roadmap.
---

# LunarBid — Developer Playbook

LunarBid is an **AI-powered proposal & bid generator SaaS** for freelancers, agencies and teams.
Stack: **MERN** — MongoDB + Mongoose, Express 5, React 19 (Vite 7), Tailwind CSS v4, framer-motion, recharts.
Repo root: `F:\LunarBid` (separate from the `teemip` repo that may be the shell CWD — always use absolute paths).

## ⚑ RESUME HERE
Active work + full done/todo state live in **`F:\LunarBid\HANDOFF.md`** — read it first. Current phase: a **design-system overhaul** (T1 landing redesign → T2 login/register → T3 propagate app-wide → T4 ergonomics/responsive). Save state to HANDOFF.md before pausing near a token limit.

## Layout
```
backend/               Express 5 API (CommonJS)
  server.js            App entry, route mounting, Stripe webhook raw-body ordering
  config/db.js         Mongo connection
  middleware/
    auth.js            JWT bearer auth -> req.user
    checkFeatureAccess.js  Plan-gate middleware
  models/  User.js  Proposal.js  ProposalAnalytics.js  ClientProfile.js  Team.js
  routes/  auth  profile  proposals  subscription  branding  clientProfiles  analytics  support
  services/aiService.js  Multi-provider AI fallback chain
frontend/ (Vite)
  src/
    context/  AuthContext.jsx  ThemeContext.jsx
    locales/  LanguageContext.jsx  en.js  fr.js
    services/api.js   Axios instance (baseURL http://localhost:5000/api) + all endpoint fns
    components/
      Auth/{Login,Register}.jsx
      Dashboard/{Dashboard,ProposalForm,ProposalHistory,ClientProfiles,Analytics,Branding,ProfileSetup,Subscription,Support}.jsx
      UI/LanguageSelector.jsx  navbar.jsx  LandingPage.jsx  DarkModeToggle.jsx
```

## Run / verify
- Mongo must be listening on `27017`. Backend: `cd F:\LunarBid\backend && node server.js` (port 5000, logs "MongoDB Connected").
- Frontend: `cd F:\LunarBid\frontend && npm run dev` (Vite, proxies `/api` -> :5000).
- `.env` (backend) already has GROQ, OPENAI, OPENROUTER + Stripe live-ish keys set; TOGETHER/ANTHROPIC/JWT_SECRET/email are placeholders. **JWT_SECRET is a placeholder — auth still works but set a real one before any deploy.**
- Frontend api.js hardcodes `http://localhost:5000/api` (not the Vite proxy) — keep both in sync.

## Domain model (plans & gating) — single source of truth is `User.js` methods
- Plans: `free | starter | pro | agency`.
- `canGenerateProposal()` — free: 5/day; starter: 50/month; pro & agency: unlimited. Resets daily/monthly counters in-place.
- `hasFeatureAccess(feature)` — matrix over {clientProfiles, analytics, customBranding, priorityAI, teamCollaboration, whiteLabel, apiAccess, prioritySupport}.
- `getPlanLimits()` — proposals/clientProfiles/teamMembers/storage/aiTokens per plan.
- **BUG/DEBT:** feature matrices are duplicated in three places with different shapes: `User.js`, `Dashboard.jsx` (`hasFeatureAccess` local), and `en.js` pricing copy. They disagree (e.g. limits: free "5/day" in code vs "3 proposals/day" in landing copy; starter shows "Unlimited" in landing but code caps 50/mo). **Consolidate to one config** (ideally a shared `plans.js` used by backend, and mirrored/served to frontend).
- Proposal model: jobTitle, jobDescription, clientName, budget, tone(formal|friendly|persuasive), length(short|medium|detailed), generatedProposal, editedProposal, status(draft|sent|accepted|rejected), isSent/sentAt.

## AI generation
- `services/aiService.js` `generateProposal(prompt, isPriority)` tries providers in order Groq → Together → OpenRouter → OpenAI → Claude, first enabled+successful wins, sanity-checks length>50.
- Prompt is built in `routes/proposals.js /generate`. `isPriorityAI` currently keyed off `plan === 'pro'` only (agency should qualify too — inconsistent with `hasFeatureAccess('priorityAI')`).
- If all providers fail, `generateFallbackProposal()` returns a templated proposal.
- Models named in code are Dec-2024-era (`llama-3.3-70b-versatile`, `claude-3-5-haiku`). Verify still valid when touching.

## THEME SYSTEM — currently broken; fix carefully
Root cause: **Tailwind v4** is loaded via `@tailwindcss/vite` with CSS-first config. `index.css` does NOT declare the dark variant, so `tailwind.config.js`'s `darkMode:'class'` is IGNORED and every `dark:` utility falls back to `prefers-color-scheme`, not the `.dark` class the app toggles.
- Fix: add to `src/index.css` (top): `@custom-variant dark (&:where(.dark, .dark *));` (and remove the duplicate `@import "tailwindcss";`). This makes `.dark` on `<html>` drive all `dark:` utilities.
- Two competing theme sources: `ThemeContext` (`darkMode`/`toggleTheme`, wraps App in main.jsx, used by navbar+dashboard) AND dead local `theme` state in `App.jsx` (prop-drilled, floating toggle commented out). **Keep ThemeContext as the single source of truth; delete the App.jsx theme state and the stray `DarkModeToggle` inline copy.**
- `index.css` hard-codes `html,body{background-color:#0f172a}` unconditionally (dark bg even in light mode) — make it theme-aware.
- Mixed styling: 16 components branch on the `darkMode` JS boolean; 7 use `dark:` utilities. After the variant fix both work. Long-term: migrate to `dark:` utilities for consistency; short-term both are fine once the variant is registered.

## i18n SYSTEM — infra good, ~5% adopted
- `LanguageContext` provides `t('a.b.c', params)` with en→fallback and `{{param}}` interpolation; `en.js`/`fr.js` are nested dicts (~200 lines each). `LanguageSelector` in navbar switches + persists `lunarbid-language`.
- **Problem: most UI strings are hardcoded English.** Only 2–22 `t()` calls per component. Dictionaries also miss most keys the UI needs. Work = (1) expand en/fr dicts to cover every screen, (2) replace hardcoded strings with `t()`. Do this screen-by-screen; keep en/fr key sets identical.
- `LANGUAGES[code].direction` is read but never defined (harmless, defaults ltr).

## Known bugs / debt inventory (keep updated)
1. [FIXED 2026-07-21] Dark mode variant registered via `@custom-variant dark` in index.css; base bg made theme-aware (`html`/`html.dark`, removed `bg-gray-50` from index.html body); App.jsx dead theme state removed; DarkModeToggle added to LandingPage + Login + Register (navbar hidden there). Verified both modes render correctly via Playwright. ThemeContext is now the single source of truth.
2. Duplicate theme systems + commented dead code across User.js, Dashboard.jsx, proposals.js, App.jsx. (App.jsx done; User/Dashboard/proposals dead blocks still to strip.)
3. Plan/feature/limit definitions triplicated and inconsistent (code vs landing copy).
4. `Send Proposal` marks sent + `console.log`s but sends NO email (nodemailer installed, unused). Either wire real email or relabel as "Mark as sent".
5. i18n mostly hardcoded.
6. Duplicate Mongoose index warning on `email` (schema `unique:true` + explicit `.index({email:1})`).
7. `isPriorityAI` uses `plan==='pro'` (excludes agency).
8. api.js base URL hardcoded; no centralized error/401 handling (401 should logout).
9. No tests, no CI, no error boundary, no toast system (uses alerts/inline).

## Conventions
- Backend CommonJS, `async/await`, try/catch → `res.status(...).json({message})`. Auth via `auth` middleware; scope every query by `user: req.user._id`.
- Frontend: functional components + hooks; Tailwind utility classes; lucide-react icons; framer-motion for transitions; recharts for charts.
- When adding user-facing text: add en+fr keys and use `t()`, never hardcode.
- When touching theme: use `dark:` utilities (now that the variant is registered) or `useTheme().darkMode`; never reintroduce a second theme source.
- Match existing file style; strip the large commented-out "backup" blocks when editing a file rather than growing them.

## Roadmap (phased)
- **P0 Foundation:** register dark variant + unify theme; fix index.css bg; remove dead code; consolidate plans config; fix duplicate index. 
- **P1 i18n:** expand dicts, wire `t()` across all screens.
- **P2 UI/UX overhaul:** consistent design tokens, toast/notification system, loading/empty/error states, responsive dashboard sidebar (mobile), accessible modals, real Send-proposal (email or PDF export).
- **P3 Feature expansion** (competitor-informed): PDF/DOCX export & shareable proposal links, proposal templates library, e-signature/accept flow, follow-up reminders, tone/length live preview, rich-text editor, client CRM pipeline, team seats & roles, cover-letter/bid variants, RFP/scope analyzer, pricing calculator, win-rate insights, Stripe billing portal, referral, Chrome extension for Upwork/Fiverr autofill.
- Verify each change by running the app (Vite + backend) and exercising the affected flow, not just building.

## Progress log
- **2026-07-21 (session 1):**
  - Created this skill. Booted app (backend :5000, Vite :5174, Mongo :27017) and audited.
  - FIXED theme system end-to-end (Tailwind v4 `@custom-variant dark`, theme-aware base bg, single ThemeContext source, toggle added to landing/login/register). Verified light+dark via Playwright.
  - Consolidated plans: new `backend/config/plans.js` (canonical: Free $0/5-day, Starter $12/50-mo, Pro $19/unl, Agency $49/unl) + `frontend/src/config/plans.js` mirror + `GET /api/subscription/plans`. Refactored `User.js` to use it, removed duplicate email index, fixed `isPriorityAI` to include agency. Restarted backend — clean, warning gone.
  - Verified core flow via API: register → auth/me → subscription → generate (Groq, 2085 chars) → history. All green.
  - REMAINING plan polish (debt): refactor `Subscription.jsx` + `LandingPage` pricing cards to read from `frontend/src/config/plans.js` instead of local arrays (numbers already agree, so cosmetic/maintainability). Update stale `en.js`/`fr.js` `landing.pricing` block (still 3-tier old prices; appears unused by current LandingPage but fix for correctness).
  - Screenshots: in-app Browser pane `computer{screenshot}` times out on this app (heavy perpetual framer-motion). Use **Playwright MCP** (`browser_take_screenshot`) — it works. Files land in the teemip repo root. To log into the UI fast: set `localStorage.token` (grab a JWT from `/api/auth/register` via curl) then navigate to `/dashboard`.
  - FIXED tone bug: ProposalForm tone `<select>` had `value="professional"` (invalid — enum is formal|friendly|persuasive); now `formal`.
  - NEW FEATURE — **AI Job-Post Analyzer** (AI intelligence): `POST /api/proposals/analyze` (+ `generateJSON` in aiService) returns {summary, keyRequirements, suggestedSkills, clientPainPoints, suggestedTone/Length, complexity, estimatedBudgetRange, redFlags, winningAngles, matchScore, matchReason}. UI: "Analyze Job Post" button + full-width responsive/themed/bilingual results panel in ProposalForm with "Apply suggestions" (sets tone+length). Verified end-to-end desktop+mobile, dark mode.
  - NEW FEATURE — **Multi-format export** (proposal power-tool): replaced single .txt download with a dropdown → PDF (styled print window), Word (.doc HTML blob), TXT, Markdown. No new deps.
  - i18n: added `dashboard.analyzer.*` and `dashboard.export.*` keys to en.js + fr.js (bilingual from the start).
  - Responsiveness: navbar tagline hidden on mobile (`hidden sm:block`); dashboard sidebar nav is now horizontal-scroll on mobile / vertical on desktop (`flex md:flex-col overflow-x-auto`), so the form is visible immediately on phones. Verified at 375px.
  - NEW — **Toast system** (`components/UI/Toast.jsx`, ToastProvider in App.jsx). Replaced ALL 18 `alert()` calls across 7 dashboard components with themed toasts. Modern, uniform UX.
  - NEW — **Test users seed** (`backend/scripts/seedTestUsers.js`): `{free,starter,pro,agency}@lunarbid.test` / `Test1234!`, each with a filled profile. Run `node scripts/seedTestUsers.js`.
  - **E2E plan-gating validated** (API matrix + UI): free→analytics/branding/clients all 403 & sees upgrade card; starter→clients 201 (limit 10); pro→analytics/branding 200 + full dashboard, priorityAI true; agency→everything + team/whiteLabel/api true. Feature flags per plan all correct.
  - BUG FIXED (caught by E2E): `models/ClientProfile.js` pre-save hook used `next()` (invalid in Mongoose 8/9) → **client-profile creation was 500 for ALL paying users**. Removed `next()`. Other models were already clean.
  - Gated tabs (Analytics/Branding/ClientProfiles) already render graceful "Available in Pro plan ($19/mo)" upgrade cards on 403 — good UX, no crash.
  - STILL PENDING: full i18n retrofit of existing hardcoded strings (task 4); real email send / shareable links (#4 — nodemailer unused); dead-code strip in Dashboard.jsx/proposals.js (task 3); responsive pass on remaining tabs; more features (templates, e-sign, pricing calc, agency/team seats UI, growth).

- **2026-07-21 (session 1, cont.) — Analyzer UX redesign (user feedback: results dumped at page bottom = bad):**
  - Analyzer is now a **slide-over side panel** (framer-motion), not an inline bottom block. Opens instantly on click with a **loading skeleton**, then fills with results. Sticky header + sticky footer (Re-analyze / Apply suggestions). Single-column content; full-screen sheet on mobile, ~lg panel on desktop.
  - CRITICAL pattern: the drawer is **portaled to `document.body`** via `createPortal`. Required because App wraps routes in a framer-motion `motion.div` (transform) which turns `position:fixed` into containing-block-relative — without the portal the panel didn't cover the viewport and its sticky footer escaped off-screen. **Any future full-screen overlay/modal in a route-level component must be portaled to body** (the Send modal in ProposalForm should also be portaled — currently isn't; low priority since it's centered).
  - Caches analysis per job-description: re-clicking reopens without a refetch; button label flips to "View AI Analysis"; "Re-analyze" forces refresh. Apply suggestions sets tone+length, toasts, and closes the panel so the change is visible. New i18n keys: `dashboard.analyzer.view` / `.reanalyze` (en+fr).

- **2026-07-21 (session 1, cont.) — Shareable proposal links (power-tool):**
  - Proposal model gained `shareToken`, `isPublic`, `viewCount`, `firstViewedAt`, `lastViewedAt`.
  - Routes: `POST /proposals/:id/share` (auth, mints token + isPublic), `POST /:id/unshare`, and **public** `GET /proposals/public/:token` (NO auth, tracks views, returns content + author name/branding). Public route is registered BEFORE `GET /:id` so it isn't shadowed.
  - Frontend: public page `components/PublicProposal.jsx` at route `/p/:token` (branded document — logo/company/tagline/website + accent color, Copy + Print/PDF, "Made with LunarBid"). Themed + responsive. Share button (Share2) added to ProposalForm actions → copies `${origin}/p/<token>` to clipboard + toast. api.js: `shareProposal/unshareProposal/getPublicProposal`. Verified end-to-end (logged-out view renders).
  - NOTE: this is the real "delivery" mechanism since SMTP creds are placeholders. The Send modal still just marks-as-sent (no email) — consider relabeling it or wiring nodemailer later.

- **2026-07-21 (session 1, cont.) — i18n retrofit (in progress):**
  - **Pattern established + verified**: add nested keys to BOTH `en.js` and `fr.js` (identical key trees), replace hardcoded JSX/toasts/placeholders/titles with `t('...')`, use `{{param}}` interpolation for dynamic bits.
  - **DONE + verified in FR live**: the whole **Generate screen (ProposalForm)** — form labels, placeholders, tone/length options, empty/loading/success states, action button titles, the Send modal (also swapped its text-"X" close for the `X` icon), and all toasts — plus dashboard **chrome** (navbar tagline + Dashboard link, sidebar "AI Ready"). Keys under `dashboard.generate.*`, `dashboard.send.*`, `dashboard.navigation.tagline/dashboardLink/aiReady`.
  - **DONE + verified in FR**: also **ProposalHistory** (title, count with `{{count}}`, empty state, all preview-panel buttons Close/Copy/Edit/Duplicate/Download/Delete, delete confirm + toast). Keys added under `dashboard.history.*`.
  - **i18n COMPLETE (2026-07-21).** Every screen is now bilingual (en/fr) and verified: LandingPage (full marketing copy — hero/problem/how/features/pricing/testimonials/CTA/footer, verified FR live), Login + Register (forms + marketing side panels, verified FR live), and all 8 dashboard tabs — Generate, History, Clients, Analytics, Branding, Profile, Subscription, Support — plus chrome/nav. `en.js`/`fr.js` have identical key trees; the `t()` helper returns arrays/objects for keys like `landing.*.items`, `dashboard.subscription.features.<plan>`, `dashboard.profile.whyList` (map over them by index). Only intentionally-untranslated: the public shared-proposal page `/p/:token` (shows user's own content) and proper nouns (plan names, testimonial names).
  - GOTCHA: when converting an inline `.map` array to i18n, don't leave both the old `const Icon = feature.icon` AND a new `(Icon, i) =>` param — causes "Identifier already declared". Remove the inner const.

- **2026-07-21 (session 1, cont.) — Auth i18n + FINAL E2E:**
  - Login/Register functional i18n done (error messages + placeholders → `auth.login.*` / `auth.register.*`). Marketing side-panels still hardcoded (decorative, low priority).
  - **Final consolidated E2E sweep — ALL GREEN**: gating matrix correct for all 4 plans (free 403×3; starter clients 200/201; pro+agency analytics/branding/clients all 200/201); new features all pass (generate, analyze 200, share, public view 200 no-auth, plans endpoint 200). No regressions after theme/plans/analyzer/export/toast/shareable-link/i18n changes.
  - Test users remain seeded: `{free,starter,pro,agency}@lunarbid.test` / `Test1234!`.

- **2026-07-21 (session 1, cont.) — Bid/Pricing Calculator (new feature):**
  - New dashboard tab **"Pricing"/"Tarifs"** → `components/Dashboard/PricingCalculator.jsx`. Deterministic (no AI), real-time. Inputs: project type, hours, hourly rate, complexity (low/med/high ×1.0/1.15/1.35), timeline (normal/rush +25%), expected revisions (×5% each). Formula: base=hours×rate → +complexity → +revision buffer → +rush → +20% platform-fee cover = recommended; range = ×0.85 / ×1.25. Shows a transparent breakdown + copy-bid. Available to all plans (no gating).
  - Wired into `Dashboard.jsx` (import + menu item after Analytics + activeTab render) and `navbar.jsx` profile menu (🧮). i18n `dashboard.calculator.*` + `dashboard.navigation.calculator` (en/fr). Verified live in FR with correct math ($1,822 for 20h×$60, medium, 2 revisions).
  - NOTE: `onUseBid` prop exists to prefill a proposal's budget but isn't wired from Dashboard yet (button hidden unless passed) — future integration.
  - Dev-server note: the Vite process can die between long sessions; restart with `cd F:\LunarBid\frontend && npm run dev` (lands on :5174 since :5173 often in use).

## Update discipline
When you discover a new fact, bug, or make an architectural decision, UPDATE this file. It is the persistent memory for LunarBid work across sessions.
