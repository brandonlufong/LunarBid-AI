# LunarBid — Phase 3: important after launch (P2, first batch)

Tests: `cd backend && npm test` → 47 passing (16 Phase 1 + 19 Phase 2 + 12 Phase 3). Frontend lint: 0 errors. Accessibility check (axe) on 12 screens: 0 violations.

## Email confirmation (SEC-9)
- New accounts get a confirmation email (link valid 24 hours) and must confirm before using AI features (analyze, generate, send). This stops free-plan limits being multiplied with throwaway accounts.
- A dashboard banner explains this and offers **Resend link**; the link opens `/verify-email`.
- Google/GitHub accounts count as confirmed. **Existing accounts are not affected**: only accounts created from now on start unconfirmed. Resetting a password also confirms the email.

## Sessions (SEC-8, UX-7)
- Sign-in tokens last **7 days** (was 30) and renew silently about once a day while the app is used (`SESSION_TTL` to change).
- **Password reset or change signs out every other device**; the current device stays signed in.
- Profile → **Security**: change password, and **Sign out of all other devices**.
- An expired or revoked session now sends the user to sign-in with an explanation instead of failing silently.
- Tokens issued before this update keep working until they expire.

## Exact usage limits (BIL-10)
- Proposal and analysis quotas are reserved **atomically** before the AI call, so simultaneous requests can no longer exceed a plan's limit or lose counts. Failed attempts and template fallbacks give the quota back. (`backend/services/usage.js`)

## Faster first load (DEP-10)
- The first download is **511 KB instead of 1,061 KB (167 KB instead of 314 KB compressed)**. The dashboard, sign-in pages, legal pages and shared proposals load on demand; the chart library (379 KB) loads only when Analytics is opened.

## Proposal history (UX-9)
- History loads 20 at a time with **Load older proposals**, instead of stopping at 100. The API returns `{ items, nextCursor }`.

## Still open (later)
Streaming AI output, localized server messages, cost dashboards, prerendering the landing page, team features before re-opening the Agency plan.
