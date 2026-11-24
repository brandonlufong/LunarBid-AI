# LunarBid — Free-Beta Launch + Teaser Video — WORK STATE (continue-here)

**Purpose:** durable state for the free-beta-launch + teaser-video brief. Read this FIRST each
session (plus `HANDOFF.md`, `LAUNCH_REPORT.md`, `PRODUCTION_CHECKLIST.md`, `DEPLOYMENT.md`, the
`lunarbid-dev` skill). Update the DONE / IN PROGRESS / TODO sections before ending every turn.
Constraints from the brief: **do not deploy, push, enable payments, or publish the beta without
explicit approval.** All work here is local.

**Last updated:** 2026-11-24.

## Run / verify
- Backend: `cd F:\LunarBid\backend && node server.js` (:5000, Mongo :27017). Tests: `npm test` (60 now).
- **Video:** `cd F:\LunarBid\video && npm run render && npm run render:short && npm run thumbnail`
  (or `npx remotion render TeaserFull out/lunarbid-teaser-30s.mp4 --codec=h264`). Real UI screenshots live
  in `video/public/` (`composer.png`, `result.png`); recapture via the logged-in app at 430×920, dark theme.
- Frontend: `cd F:\LunarBid\frontend && npm run dev`; build check: `npm run build` (fast, catches real errors).
- Seeded users (pw `Test1234!`): `free@ / starter@ / pro@ / agency@lunarbid.test` (may be UNVERIFIED — AI routes need a verified email).
- **ENV QUIRK (important):** something answers `localhost:5000` that the OS doesn't list as a listener
  (an agent HTTP proxy / `vestauth` env shim), and it can serve STALE code — `/api/meta` 404'd on :5000
  while a fresh `PORT=5055 node server.js` served it correctly. To smoke-test backend changes reliably,
  start a fresh instance on an unused port (`PORT=5055 node server.js`) and curl that. `npm test` imports
  `app.js` directly and is the most reliable verification.

## GO / NO-GO for public free beta  →  **NO-GO (config/credentials), code mostly ready**
Blocking (all are the owner's config/purchases, not code):
1. **Email not configured** → verification + password-reset emails can't send. AI generation requires a
   confirmed email, so testers would be stuck. Set `RESEND_API_KEY` + `EMAIL_FROM` (Resend; no code change).
2. `JWT_SECRET` and `FRONTEND_URL` are placeholders locally (must be real in the deployed env; the API
   already refuses to start in production without them).
3. Domain `lunarbid.ai` not purchased (do not present it as live). OAuth optional (keys unset → buttons hidden).
Non-blocking / recommended before opening: global AI spend ceiling (code below), landing "Free beta" badge.

## DONE this session (2026-11-24) — verified
- **Confirmed already-built** (by prior sessions): forgot-password + reset-password, Google/GitHub OAuth
  (secure code-exchange `/auth/oauth/exchange`), email verification, 7-day sessions, atomic quotas,
  billing gating (`billing/access.js`), production config validation (`config/env.js`). App is
  production-polished per `LAUNCH_REPORT.md` (23/23 E2E, 0 axe, 49 tests before this session).
- **Beta-safety layer (NEW):**
  - `backend/config/beta.js` — server-enforced flags. Defaults = normal production (tests stay green);
    beta opts in via `.env`. Flags: `BETA_MODE`, `BILLING_ENABLED`, `AI_GENERATION_ENABLED` (kill switch),
    `REGISTRATION_ENABLED`, `BETA_DAILY_PROPOSALS=3`, `BETA_MONTHLY_PROPOSALS=15`, spend ceilings.
    `applyBetaLimits()` only ever TIGHTENS plan caps (never raises). `publicFlags()` is client-safe.
  - **AI kill switch** on `POST /proposals/generate` + `/analyze` (503 `ai_paused` when `AI_GENERATION_ENABLED=false`).
  - **Billing guard** in `createCheckout` (403 "payments aren't available yet" when `BILLING_ENABLED=false`).
  - **Registration guard** in `/auth/register` (403 when `REGISTRATION_ENABLED=false`).
  - **Beta caps** applied in `services/usage.js#reserve` (proposals) via `beta.applyBetaLimits`.
  - **Public flags endpoint** `GET /api/meta` (mounted in `app.js`) → `{betaMode,billingEnabled,aiEnabled,registrationEnabled}`.
  - `.env` activated locally (`BETA_MODE=true`, `BILLING_ENABLED=false`); documented in `.env.example`.
  - Tests: new `backend/test/beta.test.js` (cap math + flags). **Full suite 55/55 green.** Smoke-verified on :5055.
- **Beta banner (frontend):** `components/app/BetaBanner.jsx` (dismissible, fetches `/api/meta`, links to
  Support for feedback), rendered in `AppShell` main; i18n `beta.*` (en+fr). **`npm run build` clean.**

## DONE this session (2026-11-24, part 2)
- **A — Global AI spend ceiling + metering: DONE & tested.** `models/AppUsage.js` (period-keyed docs,
  atomic `$inc`) + `services/spend.js` (`withinCeiling()` checked before the AI call, FAIL-OPEN on any
  metering error so a hiccup never blocks real work; `record(kind)` adds estimated cost after a real,
  non-fallback AI call). Wired into `/generate` + `/analyze` (503 `capacity` when over ceiling; spend
  recorded only on success). Cost estimates `AI_COST_PER_PROPOSAL_USD` (0.004) / `AI_COST_PER_ANALYSIS_USD`
  (0.001) — documented in `.env.example`. New `test/spend.test.js`. **Full suite 59/59 green.**
- **A — Landing "Free beta" badge: DONE.** `LandingPage.jsx` fetches `/api/meta`; shows a neutral
  "Free beta" badge beside the hero eyebrow when `betaMode`. Hero note already reads "No card needed."
  `npm run build` clean.
- **C — User guide: DONE.** `USER_GUIDE.md` (13 sections, accurate to the real feature set — no fabricated
  capabilities; reflects beta limits, "payments not available yet", verify-email, export/share, plans by tier).
- **B — video tooling CHECKED:** no system `ffmpeg`/`ffprobe`, no `@ffmpeg/ffmpeg`/`fluent-ffmpeg`/`canvas`/
  `@napi-rs/canvas`, no Remotion, no `playwright` npm pkg. ⇒ the only real-MP4 path is **Remotion**
  (self-contained: bundles Chromium + ffmpeg for `npx remotion render`) or WASM `@ffmpeg/ffmpeg`; both need install.

## DONE this session (2026-11-24, part 3)
- **BUG FIXED — feedback path was 500-ing.** `POST /api/support/tickets` returned 500 because
  `routes/support.js` used two **callback-style (`next`) pre-save hooks**, which **Mongoose 9.10.2
  rejects** (`TypeError: next is not a function`). Rewrote both as synchronous no-arg hooks. Verified
  end-to-end on a fresh backend (`PORT=5057`): **POST → 201**, ticket shows in `GET /tickets`, priority
  hook still runs (pro→high). Added **`test/mongoose-middleware.test.js`** — a static guard that fails if
  ANY model/route hook declares a `next` param (this was the only offender in the codebase). **Suite 60/60.**
- **B — TEASER VIDEO: DONE (real MP4s rendered).** Remotion project at `F:\LunarBid\video\`:
  - `out/lunarbid-teaser-30s.mp4` — full teaser, 9:16 1080×1920 30fps H.264 (~4.1 MB).
  - `out/lunarbid-teaser-15s.mp4` — short cut (~2.6 MB).
  - `out/thumbnail.png` — branded 1080×1920 poster.
  - **Real UI** embedded: captured the live app (logged-in demo user, dark theme) — a filled composer
    (synthetic coffee-roaster brief) and a **genuinely AI-generated proposal** in the document editor —
    into `public/composer.png` / `result.png`. Verified a rendered workflow frame shows the real composer.
  - 5-scene storyboard in `src/Teaser.jsx`; silent-friendly on-screen text; CTA "Free beta — coming soon /
    No card needed · Usage limits apply"; "Built by NWEE" end card. **No `lunarbid.ai` shown as live.**
  - Copy deliverable: `video/CAPTIONS_AND_COPY.md` (EN+FR captions, WhatsApp/FB/IG/LinkedIn/X variants, alt text).
- **D — real-UX E2E (partial, this session):** login → (email verified) → generate (real AI draft, 273 words,
  tailored) → result editor (Edit/Copy/More, Saved) → Support feedback submit (201). All green. Remaining E2E
  legs that need **email configured**: email verification link + forgot-password delivery (code paths exist/tested).

## TODO (ordered for the loop)  →  **A–D done; E + full-email E2E blocked on owner config**
### A — finish beta mode — DONE (feedback path fixed & verified this session).
- [ ] (optional, not blocking) Cloudflare Turnstile on register/login, validated server-side, gated by env.
### B — teaser video — DONE (real 30s + 15s MP4 + thumbnail + captions). Optional: add burned-in subtitles track.
### C — user guide — DONE (`USER_GUIDE.md`).
### D — full real-UX E2E — core legs walked & green this session. BLOCKED only on email config for the
      verification-email + forgot-password *delivery* legs (set `RESEND_API_KEY` + `EMAIL_FROM`).
### E — domain/launch prep — BLOCKED on owner buying `lunarbid.ai`; reconciliation already documented in
      `PRODUCTION_CHECKLIST.md` §D/§H + `DEPLOYMENT.md`. No code regression.

## OWNER ACTION ITEMS (the only things between here and opening the free beta)
1. **Configure email** (Resend): set `RESEND_API_KEY` + `EMAIL_FROM`. Without it, verification &
   password-reset emails can't send, and AI needs a verified email — testers would be stuck.
2. **Buy the domain** `lunarbid.ai` (and decide `api.lunarbid.ai`). Until then it's not shown as live anywhere.
3. **Set real secrets in the deployed env:** `JWT_SECRET`, `FRONTEND_URL` (API refuses to start in prod without
   them). Optional: Google/GitHub OAuth keys (buttons stay hidden while unset).
4. **Flip beta flags on the server:** `BETA_MODE=true`, `BILLING_ENABLED=false` (already set locally; see `.env.example`).
Code is beta-ready: server-enforced limits/kill-switch/spend-ceiling, feedback path fixed, teaser produced.

## Loop protocol
Small, compiling increments. After each: `npm test` (backend) and `npm run build` (frontend) stay green.
**STATUS: A–D complete; E and the email-delivery E2E legs are blocked solely on the owner's config/purchases
above — nothing more is codeable without them. Loop STOPPED this turn** (`ScheduleWakeup { stop:true }`).
Resume only if the owner provides credentials or requests further features.
