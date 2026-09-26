# LunarBid — Phase 1: launch blockers

This change fixes the P0 issues from the production-readiness audit. Backend tests: `cd backend && npm test` (16 tests, no database or Stripe account needed).

## What changed

### Billing (BIL-1 to BIL-4)
- **Access now requires confirmed payment.** A paid plan counts only while Stripe reports the subscription as `active`, `trialing` or `past_due` (see `backend/billing/access.js`). All feature gates and limits use this.
- **Purchases go through Stripe Checkout** (`POST /api/subscription/checkout` returns a URL). The old `/upgrade` endpoint now does the same and never grants a plan by itself.
- **Plan changes, cancellation, invoices and cards go through the Stripe Customer Portal** (`POST /api/subscription/portal`). The app shows **Manage billing** instead of Cancel.
- **Webhook rebuilt** (`backend/routes/stripeWebhook.js`): its own raw-body route at `/api/stripe/webhook` (the old `/api/subscription/webhook` path still works), signature verified, subscription re-read from Stripe on every event, Stripe's exact statuses, duplicate events skipped, and a 500 on failure so Stripe retries.
- **Agency is not for sale** until team collaboration, white-label and API access exist (`purchasable: false` in `backend/config/plans.js`). It shows "Coming soon".

### Security (SEC-1 to SEC-3)
- Password-reset links are never returned by the API. In development they print to the server console.
- Rate limits on sign-in, sign-up, password reset, AI endpoints and public share links.
- CORS limited to `FRONTEND_URL` (+ `CORS_ORIGINS`); security headers via helmet; 8-character minimum password.

### AI cost controls (AI-1)
- Input caps on everything sent to the AI (job description max 8,000 characters).
- The job analyzer is metered per day by plan (Free 10, Starter 40, Pro 150).
- When every AI provider fails, the template fallback is flagged in the UI and not counted against the user's limit.

### Configuration and operations (DEP-1 to DEP-3)
- Frontend API address from `VITE_API_URL` (dev uses the Vite proxy).
- Backend refuses to start in production with missing or placeholder settings (`backend/config/env.js`).
- `/health` endpoint, request ids, one error handler with safe messages, structured logs, database connection retries, graceful shutdown.
- Optional Sentry on backend (`SENTRY_DSN`) and frontend (`VITE_SENTRY_DSN`); the frontend shows a recovery screen instead of a blank page if it crashes.
- Email can use any transactional provider over SMTP (`SMTP_HOST`...), with the Gmail settings kept as a fallback.

### Honesty and legal (LEG-1, LEG-2)
- Removed "10,000+ users", "4.9/5", "500K+ proposals", "3x/5x/60% more bids" and the invented testimonials (EN and FR). Stats now show product facts: 5 AI providers, 4 export formats, 2 languages. "Start Free Trial" buttons say "Get started" (there is no trial).
- New Terms of Service, Privacy Policy and Refund Policy pages at `/terms`, `/privacy`, `/refunds`, in English and French, linked from the footer and the sign-up form. **Have them reviewed by counsel before launch**, and confirm `SUPPORT_EMAIL` in `frontend/src/content/legal.js`.

### Also fixed
- The API crashed on startup when `GROQ_API_KEY` was not set, even with other AI providers configured.
- Removed the unused `gpt4all` dependency (large native binaries) and its test script.

## Applying this change

```bash
git checkout -b phase1-launch-blockers
git apply lunarbid-phase1.patch

# Stop tracking node_modules (audit SEC-7); they are reinstalled from package-lock.json
git rm -r --cached backend/node_modules
echo "node_modules/" >> .gitignore

cd backend && npm install && npm test && cd ..
cd frontend && npm install && npm run build && cd ..
git add -A && git commit -m "Phase 1: fix launch blockers (billing, security, config, legal)"
```

## Stripe setup checklist (required for billing to work)

1. **Webhook endpoint** — Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://<your-api-domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
2. **Customer Portal** — Settings → Billing → Customer portal: turn on cancellation (at period end), payment-method updates, invoice history, and **switching plans** between the Starter and Pro prices.
3. **Failed payments** — Settings → Billing → Subscriptions and emails: choose what happens after all retries fail (cancel the subscription, or mark it unpaid). Either one removes paid access automatically.
4. **Prices** — make sure `STRIPE_STARTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID` match monthly prices of $12 and $19.
5. **Test it end to end in test mode** with `stripe listen --forward-to localhost:5000/api/stripe/webhook` and card `4242 4242 4242 4242`: subscribe, change plan in the portal, cancel, and use card `4000 0000 0000 0341` to test a failed renewal.
6. **Existing test users** that were "upgraded" with the old flow have `plan` set but no confirmed subscription: they now correctly see the Free plan.

## Environment variables

Backend (`backend/.env.example`): new or changed — `FRONTEND_URL` (required, https in production), `CORS_ORIGINS`, `JWT_SECRET` (32+ characters), `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `EMAIL_FROM`, `SENTRY_DSN`, `TRUST_PROXY`.

Frontend (`frontend/.env.example`): `VITE_API_URL`, `VITE_SENTRY_DSN`.

## Not in this phase (P1, next)
Hosting setup and object storage for logos (DEP-4, DEP-5), transactional email account (DEP-6), CI (DEP-7), staging and backups (DEP-8), SEO for the landing page (DEP-9), "Send proposal" that really sends (UX-1), invented experience in prompts (AI-2), AI timeouts and model configuration (AI-4, AI-5), accessibility labels (UX-4), account deletion (API-3), OAuth `state` and verified emails before enabling social sign-in (SEC-5), a request validation layer across remaining routes (API-1).
