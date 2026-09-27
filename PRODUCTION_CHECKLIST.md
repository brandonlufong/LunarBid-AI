# LunarBid production checklist

Step-by-step instructions for each item are in `DEPLOYMENT.md`. Prices as of September 2026; confirm at sign-up.

## A. Services you must purchase
| Service | Cost | Notes |
|---|---|---|
| `lunarbid.ai` domain | ~$140–165 up front | `.ai` requires a 2-year minimum registration |
| Render Starter (API) | $7/month | Always-on; the free tier sleeps |
| MongoDB Atlas Flex | ~$8/month (capped at $30) | Includes backups |
| AI provider credit | usage-based | At least one of Groq / OpenAI / Anthropic / Together / OpenRouter; two recommended for fallback |
| Paddle | no monthly fee; ~5% + $0.50 per sale | Merchant of record; integration still to be built |

## B. Free services you can use
Cloudflare (DNS, Workers static hosting, SSL, redirects, Email Routing), Cloudflare R2 (10 GB), Resend (3,000 emails/month, 100/day), Sentry Developer plan, UptimeRobot or Better Stack free monitors, GitHub Actions (public repo or free minutes).

## C. Accounts you must create
Cloudflare · Render · MongoDB Atlas · Resend · Sentry · an uptime monitor · at least one AI provider · Paddle (when billing is built) · Google Cloud / GitHub OAuth apps (only if you want social sign-in).

## D. DNS records (Cloudflare)
| Name | Type | Value | Proxy |
|---|---|---|---|
| `lunarbid.ai` | (added automatically) | Worker custom domain `lunarbid-web` | proxied |
| `www` | AAAA | `100::` + Redirect Rule 301 → `https://lunarbid.ai` (keep path + query) | proxied |
| `api` | CNAME | `<your-service>.onrender.com` | **DNS only** |
| `files` | (added automatically) | R2 bucket custom domain | proxied |
| Email records | see H | | DNS only |

SSL/TLS mode: **Full (strict)**; enable **Always Use HTTPS**.

## E. Environment variables
**Frontend (Cloudflare build variables):** `VITE_API_URL=https://api.lunarbid.ai/api` · `VITE_SENTRY_DSN` (optional).

**Backend (Render):** `MONGODB_URI` · `JWT_SECRET` (auto-generated) · `FRONTEND_URL=https://lunarbid.ai` · `BACKEND_URL=https://api.lunarbid.ai` · AI keys (`GROQ_API_KEY`, `OPENAI_API_KEY`, …) · `SMTP_HOST=smtp.resend.com` `SMTP_PORT=587` `SMTP_USER=resend` `SMTP_PASSWORD` `EMAIL_FROM="LunarBid <no-reply@lunarbid.ai>"` · `S3_BUCKET` `S3_REGION=auto` `S3_ENDPOINT` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` `S3_PUBLIC_URL=https://files.lunarbid.ai` · `SENTRY_DSN` · optional `GOOGLE_*`, `GITHUB_*`.
Payments: leave all `STRIPE_*` empty (payments disabled) until Paddle is implemented. Setting only some of them stops the API from starting, on purpose.

## F. Webhooks
- Current code (Stripe, not usable from Cameroon): `https://api.lunarbid.ai/api/stripe/webhook`
- Planned: `https://api.lunarbid.ai/api/paddle/webhook` (to be implemented with the Paddle integration)

## G. OAuth callback URLs (optional)
- Google: `https://api.lunarbid.ai/api/auth/google/callback`
- GitHub: `https://api.lunarbid.ai/api/auth/github/callback`

## H. Email DNS records
- **Resend (sending):** the SPF (TXT) and MX records on `send.lunarbid.ai` and the DKIM TXT `resend._domainkey.lunarbid.ai` — copy the values exactly from the Resend dashboard.
- **DMARC:** TXT `_dmarc.lunarbid.ai` → `v=DMARC1; p=none; rua=mailto:dmarc@lunarbid.ai` (move to `p=quarantine` after a few weeks).
- **Receiving (support@):** Cloudflare Email Routing adds its MX and SPF records on the apex automatically.

## I. Frontend deployment
1. Cloudflare → Workers & Pages → Create → Import repository.
2. Root `frontend`; build `npm run build`; deploy `npx wrangler deploy`.
3. Build variable `VITE_API_URL`.
4. Custom domain `lunarbid.ai`; www redirect rule.
5. Open `https://lunarbid.ai/dashboard` directly (tests SPA routing) and check the response headers include `content-security-policy`.

## J. Backend deployment
1. Render → New → Blueprint → repository (`render.yaml`: Frankfurt, Starter).
2. Fill the variables; add custom domain `api.lunarbid.ai` (CNAME, DNS only).
3. `https://api.lunarbid.ai/health` → `{"status":"ok","db":true}`.
4. Render Shell → `npm run ai:check` → at least one provider OK (two for fallback).

## K. Database setup
Atlas Flex on AWS eu-central-1 · user with `readWrite` on `lunarbid` only · network access for Render · default alerts on · confirm backups are scheduled · separate M0 cluster or database for staging.

## L. Email setup
Resend domain verified (SPF, DKIM, MX) · DMARC added · API key with sending access only · Email Routing for `support@lunarbid.ai` · send yourself a password reset and a proposal email and check they land in the inbox, not spam.

## M. Monitoring setup
Sentry React + Node projects with DSNs set and an alert rule · uptime monitors on `https://lunarbid.ai` and `https://api.lunarbid.ai/health` · Atlas alerts · check Render logs after the first day.

## N. Final go-live tests
- [ ] Register a new account; the confirmation email arrives; the link confirms it
- [ ] Sign out and sign in; "Forgot password" email arrives and works; other devices are signed out afterwards
- [ ] Home shows the checklist and your real usage
- [ ] Analyze a job post; generate a proposal; edit it; save; reload the page and the edit is still there
- [ ] Export PDF and Word; copy the share link and open it in a private window; stop sharing and the link shows "not available"
- [ ] Email a proposal to yourself; reply goes to your own address
- [ ] Mark proposals Won/Lost; (Pro) Analytics shows the win rate
- [ ] Plan & billing shows your plan; "Upgrade" explains payments aren't available yet (until Paddle is live)
- [ ] Settings: save profile; change password; sign out of other devices; export data; delete a test account
- [ ] Upload a logo (Pro) and see it on a shared proposal (served from `files.lunarbid.ai`)
- [ ] English ↔ French; light ↔ dark; phone and desktop
- [ ] Unknown URL shows the 404 page; `https://www.lunarbid.ai` redirects to `https://lunarbid.ai`
- [ ] A test error appears in Sentry; stopping the API triggers the uptime alert
- [ ] Legal pages reviewed by counsel; `support@lunarbid.ai` receives mail
- [ ] A database backup has been restored successfully once
