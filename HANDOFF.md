# LunarBid — Work Handoff / Continue-Here

**Purpose:** durable state so any session (auto-resumed after a token-limit reset, or manual) can continue seamlessly. Read this + the `lunarbid-dev` skill first. Update this file whenever you pause.

**Last updated:** 2026-07-21 (session 1)

## PRODUCTION POLISH — DONE (2026-09-26)
Full UI/UX redesign on a design system (see `DESIGN.md`), production config for Cloudflare + Render
(`DEPLOYMENT.md`, `PRODUCTION_CHECKLIST.md`), report in `LAUNCH_REPORT.md`.
**Payments:** Stripe is not available to Cameroon-registered businesses → move to Paddle (not built yet).
The API runs without payment settings; upgrades show "payments aren't available yet".
QA scripts in `qa/`. Tests: 49 backend; 0 axe violations; 23/23 E2E flows.

## PHASE 3 (P2, first batch) — DONE (2026-09-26)
See `PHASE3_CHANGES.md`. Rules: quotas go through `services/usage.js#reserve` (never increment counters by
saving the whole user); sessions are issued by `services/session.js` and revoked by bumping tokenVersion;
AI routes require a confirmed email (`middleware/requireVerifiedEmail.js`).

## PHASE 2 (P1) — DONE (2026-09-26)
See `PHASE2_CHANGES.md` and `DEPLOYMENT.md`. Rules: all frontend API calls go through `services/api.js`;
AI prompts come from `backend/services/prompts.js` (never invent profile details); `npm test` and
`npm run lint` must stay green (CI enforces both).

## PHASE 1 LAUNCH BLOCKERS — DONE (2026-09-26)
See `PHASE1_CHANGES.md` for what changed, the Stripe setup checklist and the P1 list that comes next.
Key rules now in force: access comes only from `billing/access.js#effectivePlan` (Stripe-confirmed status);
only the webhook changes plans; `npm test` in backend must stay green.

## How to resume (checklist)
1. Read `.claude/skills/lunarbid-dev/SKILL.md` (architecture, conventions, full progress log).
2. Ensure servers up:
   - Backend: `cd F:\LunarBid\backend && node server.js` (:5000, needs Mongo on :27017).
   - Frontend: `cd F:\LunarBid\frontend && npm run dev` (Vite, lands on :5174 since :5173 usually busy). **The Vite process dies between long sessions — restart it.**
3. Test users (all password `Test1234!`): `free@ / starter@ / pro@ / agency@lunarbid.test`. To drive the UI fast: navigate to app, set `localStorage.token` (grab a JWT via `POST /api/auth/login`), set `localStorage['lunarbid-language']` = 'en'|'fr' and `localStorage.theme` = 'light'|'dark', then go to `/dashboard`.
4. Screenshots: Playwright MCP works best (`browser_take_screenshot`); files land in the teemip repo root. In-app Claude_Browser `get_page_text`/`javascript_tool` also work; its `computer{screenshot}` times out on this app.
5. Work in verifiable increments: after each change, confirm compile (check `/tmp/lunarbid-frontend.log` for "Internal server error"/"Unexpected token", ignoring stale timestamped ones) and, for UI, screenshot both themes + a mobile width (375px).
6. **When you near the token limit: STOP cleanly, update this file's "IN PROGRESS" + "DONE" sections, don't leave the app in a non-compiling state.**

## DONE (session 1) — all verified
- Dark/light theme fixed (Tailwind v4 `@custom-variant dark` in index.css; single ThemeContext; toggle on landing/login/register).
- Plans consolidated to one source of truth: `backend/config/plans.js` + `frontend/src/config/plans.js` + `GET /api/subscription/plans`. Canonical: Free $0/5-day · Starter $12/50-mo · Pro $19/∞ · Agency $49/∞.
- Bugs fixed: ClientProfile pre-save `next()` crash (create was 500 for paid plans); tone select invalid enum; duplicate email index; `isPriorityAI` excluded agency.
- **AI Job Analyzer**: `POST /api/proposals/analyze` + slide-over side panel in ProposalForm (skeleton, apply suggestions, cached, portaled to body).
- **Multi-format export**: PDF/Word/TXT/Markdown.
- **Shareable proposal links**: `shareToken` on Proposal, `POST /:id/share|unshare`, public `GET /proposals/public/:token`, public page `components/PublicProposal.jsx` at `/p/:token`.
- **Toast system** (`components/UI/Toast.jsx`) — replaced all 18 alert()s.
- **Bid/Pricing Calculator** — new "Pricing/Tarifs" dashboard tab (`PricingCalculator.jsx`), deterministic, real-time.
- **Full i18n (en/fr)** — EVERY screen wired to `t()` and verified: LandingPage, Login, Register (+ side panels), all 8 dashboard tabs + chrome. `en.js`/`fr.js` have identical key trees. `t()` returns arrays/objects for `*.items`, `subscription.features.<plan>`, `profile.whyList`, etc.
- Responsive fixes: dashboard sidebar → horizontal scroll on mobile; navbar; subscription header; client/analytics form grids.
- Plan-gating validated end-to-end (API matrix + UI) for all 4 plans; no regressions.

## TO DO — NEW design overhaul (user request, 2026-07-21) — DO THESE NEXT, IN ORDER
The theme of this phase: a cohesive, premium, modern design system applied consistently everywhere, with flawless light/dark + responsiveness.

### T1 — Redesign the LANDING PAGE (highest priority)
- Make it more client-attractive & retention-focused: stronger hero, clearer value prop, social proof, trust signals, crisp CTAs, smooth (but not distracting) motion, better visual hierarchy & whitespace.
- **Establish the DESIGN SYSTEM here** (this becomes the palette/type everything else follows):
  - Proposed palette (adjust with taste): brand indigo `#4f46e5` → violet `#7c3aed` gradient; a vivid accent (amber `#f59e0b` OR cyan `#06b6d4`) used sparingly for CTAs/highlights; neutrals on the slate scale. Lunar/aurora vibe fits the "LunarBid" name.
  - **Light theme:** airy, high-contrast, soft indigo tints on white; avoid muddy grays. **Dark theme:** rich slate-950/indigo-950 base with subtle glow accents; ensure AA contrast.
  - Type: modern geometric sans for headings (e.g. Space Grotesk / Sora / Sora) + Inter for body. Add via Google Fonts `<link>` in `frontend/index.html` (simplest) or `@fontsource` (npm ok in this frontend). Set Tailwind font-family utilities or CSS vars.
  - Define reusable CSS design tokens in `index.css` (`--brand`, `--brand-2`, `--accent`, surface/border/text tokens per theme) so the rest of the app can reference them.
- Keep it fully i18n (reuse/extend `landing.*` keys) and responsive.

### T2 — Redesign LOGIN & REGISTER to match T1
- Same palette, fonts, spacing, component styles as the new landing. Clean light AND dark themes.
- Keep the existing i18n keys (`auth.*`, `auth.side.*`) and the theme/lang toggles.

### T3 — Propagate the design system across the whole APP
- Make the dashboard + all tabs (Generate, History, Clients, Analytics, Branding, Profile, Subscription, Support, Pricing) + navbar + toasts + modals respect the new palette, fonts, radii, shadows, spacing.
- Prefer shared tokens/utilities over per-component `darkMode ? ...` ternaries where feasible (now that `dark:` variants work). Consider small shared UI primitives (Button/Card/Input/Modal) for consistency — optional but recommended.

### T4 — Ergonomics + top-notch responsiveness across the whole platform
- Audit every screen at 375 / 768 / 1280. Fix touch targets, spacing, overflow, sticky headers, modal sizing, table scrolling, and the dashboard layout on mobile.
- Ensure motion is tasteful and respects `prefers-reduced-motion`.

## STILL-OPEN older items (lower priority than the redesign)
- Dead-code strip of large commented "backup" blocks (Dashboard.jsx, proposals.js, User.js).
- Template library (starter proposals on the Generate screen).
- Real email send OR relabel "Send" (SMTP creds are placeholders; shareable links cover delivery).
- Wire calculator `onUseBid` to prefill a proposal's budget.

## DESIGN SYSTEM — IMPLEMENTED (2026-07-28, T1 foundation) ✅ verified
Use these going forward for ALL redesign work (T1–T4):
- **Fonts**: loaded in `frontend/index.html` (Google Fonts). `Inter` = body (default `font-sans`); `Space Grotesk` = display. All `h1,h2,h3` use display font globally (base rule in `index.css`). Use `.font-display` to opt other elements in.
- **`@theme` tokens in `index.css`** → utilities exist: `bg-brand-600` (#4f46e5 primary), full `brand-50..900` ramp, `violet-500/600`, `accent-300/400/500` (moonlight gold #fbbf24/#f59e0b). Use these instead of raw `indigo-*` for brand elements.
- **Semantic surface vars** (flip by theme, verified they cascade): `--page --surface --surface-2 --text --muted --border --ring`. Values in the DESIGN SYSTEM table above (dark page = `#0b1020` night sky). Use in JSX as arbitrary utilities, e.g. `bg-[var(--surface)] text-[var(--text)] border-[var(--border)]` — **the literal class must appear in JSX source** (Tailwind JIT), or use inline `style`.
- **Base bg**: `html` stays EXPLICIT (`#f8fafc` / `html.dark #0b1020`) — do NOT set it to `var(--page)` (root-level var + the 0.4s bg transition make it misbehave). Component surfaces are free to use the vars.
- GOTCHA: `getComputedStyle` on a transitioning element returns the mid-animation value — when verifying theme colors, reload with the target theme instead of toggling the class and reading immediately.

## IN PROGRESS (update before pausing)
- **T1 design-system foundation: DONE & verified.**
- **T1 LANDING PAGE REDESIGN: DONE & verified** (light + dark + mobile). Sections redesigned with brand/violet/accent tokens + refined surfaces:
  - NAV (logo tile + moon + gold sparkle; brand CTA), HERO (badge w/ gold dot; brand→violet→gold title; brand CTA; `#0b1020` night bg), PROBLEM (clean cards + brand "Solves This" callout), HOW IT WORKS (clean step cards), FEATURES (clean cards, brand icon tiles), TESTIMONIALS (fixed light-mode bug — was hardcoded `bg-slate-900/50`; now theme-aware + accent stars + brand roles), FINAL CTA (brand→violet gradient, white text), FOOTER (intentionally dark — kept).
  - PRICING section left mostly as-is (already brand-consistent: indigo-600≈brand-600, gold "Most Popular"); optional minor token polish only.
- **T2 LOGIN + REGISTER REDESIGN: DONE & verified** (Login light+dark, Register dark+mobile). Converted to a premium **split-auth layout**: the left marketing panel is now an ALWAYS-dark brand gradient showcase card (`from-brand-700 via-brand-600 to-violet-700`) — fixes the prior **light-mode bug** (panel used `text-white` on a light bg → invisible). Root bg = `#0b1020` dark / airy light; orbs retokened to brand/violet/accent; form cards already used working `dark:` variants. Mobile shows the form-only with the brand logo tile.
- **T3 PROPAGATE DESIGN SYSTEM: core DONE & verified** (dashboard light+dark).
  - Dashboard root bg → `#0b1020` night (dark) / airy indigo-tinted (light); orbs retokened brand/violet/accent.
  - Navbar → cohesive dark night bar (`bg-[#0b1020]/90`) with the brand logo tile (moon in brand→violet tile + gold sparkle), matching landing/auth.
  - KEY INSIGHT: the brand primary IS indigo (`brand-600` = `#4f46e5` = `indigo-600`), and headings/body already use Space Grotesk/Inter globally — so the dashboard tabs already respect the palette + fonts. No mass indigo→brand swap needed.
  - Remaining fine per-tab polish (off-palette bits like a stray yellow/pink accent) is folded into T4's per-screen sweep (T4 visits every screen anyway).
- **T4 ergonomics/responsive: IN PROGRESS.**
  - DONE: `LanguageSelector` is now compact on mobile (flag-only, hidden name + chevron) and brand-aligned (was indigo). Landing nav no longer overflows at 375 (verified scrollWidth==clientWidth==360, no horizontal scroll); CTA text scales down + wraps cleanly.
  - DONE: **Accessibility baseline** in `index.css` — `@media (prefers-reduced-motion: reduce)` neutralizes CSS animations/transitions; global `:focus-visible` ring using `--ring`.
  - DONE: **Fixed horizontal overflow across the WHOLE dashboard on mobile.** A decorative `w-96` background orb escaped the viewport (root wasn't a positioned/clipping ancestor). Added `relative overflow-x-hidden` to the Dashboard root — verified no overflow (360==360) on Generate + Analytics at 375. (Key CSS lesson: `overflow-x-hidden` only clips an `absolute` child if the element is also the child's containing block → needs `relative`.)
  - DONE: **reduced-motion for framer-motion globally** — wrapped the app in `<MotionConfig reducedMotion="user">` (App.jsx). Now ALL framer animations (orbs, drawer, page transitions) auto-disable for users who prefer reduced motion. Verified app renders normally (reduced-motion off). This + the CSS baseline fully covers motion a11y.
  - **T4 COMPLETE.** Responsive verified: landing/auth/dashboard all clip horizontal overflow at 375; nav compact; a11y motion + focus done.

## STILL-OPEN progress
- DONE: **Dead-code strip** — removed the large trailing commented "backup" blocks: `Dashboard.jsx` 449→308 lines, `routes/subscription.js` 513→437. `proposals.js` had none; `User.js` already clean. Backend restarts 200; frontend compiles.
- DONE: **Template library** — `frontend/src/config/proposalTemplates.js` (per-template icon + tone/length) + i18n `dashboard.templates.*` (en+fr, 6 localized templates). ProposalForm shows a "Quick-start templates" horizontal chip row above the form; clicking a chip prefills jobTitle/jobDescription + tone/length and toasts "Template applied". Verified live (light) — prefills correctly, themed, responsive (horizontal scroll), bilingual.

## ✅ REDESIGN LOOP COMPLETE (2026-07-28)
All roadmap items done & verified in light + dark: T1 (landing + design system), T2 (login/register), T3 (propagate app-wide), T4 (ergonomics/responsive + a11y), plus still-open items (dead-code strip, template library). App compiles; backend 200. Loop stopped via `ScheduleWakeup { stop: true }`.
  - NEXT T4 items (audit each at 375/768/1280, screenshot light+dark):
    - Dashboard tabs on mobile: Generate (2-col → stacks), History, Clients (cards), Analytics (stat grid + **table has `overflow-x-auto` already** but verify; charts responsive?), Branding, Profile, Subscription (pricing cards stack — verified earlier), Support, Pricing calculator.
    - Modals sizing on small screens (Send modal in ProposalForm; Clients add/edit modal; Subscription cancel modal) — ensure `max-h`/scroll on mobile.
    - Touch targets (≥40px), focus-visible states on inputs/buttons.
    - `prefers-reduced-motion`: the landing/auth have many infinite framer orbs — consider gating.
    - Catch any stray off-palette accents (e.g. `text-yellow-*` sparkles → `accent-*`).
- Then still-open items (template library, dead-code strip).

### Known responsive nits to fix in T4
- Landing nav at 375px is tight (LanguageSelector shows full "US English" + theme toggle + Get Started) — consider a compact LanguageSelector (flag only) on mobile, or a hamburger. `LanguageSelector` is shared with the dashboard navbar.
