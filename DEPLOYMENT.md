# Deploying LunarBid to https://lunarbid.ai

Do the steps in order; each produces something the next one needs. Nothing here requires code changes.
Prices were checked in September 2026 and change often: confirm them when you sign up.

## Architecture

```
Browser ──► https://lunarbid.ai          Cloudflare Workers (static assets)   frontend/wrangler.jsonc
        │   (www.lunarbid.ai ─301─► apex)
        └─► https://api.lunarbid.ai      Render web service, Frankfurt        render.yaml
                 ├─► MongoDB Atlas (AWS eu-central-1)
                 ├─► AI providers (Groq, OpenAI, ... with fallback)
                 ├─► Resend (SMTP) — email from @lunarbid.ai
                 ├─► Cloudflare R2 — logos at https://files.lunarbid.ai
                 ├─► Payments: Stripe today → Paddle (planned)
                 └─► Sentry (errors)
```

| Piece | Service | Why |
|---|---|---|
| Frontend | Cloudflare Workers static assets | Free static hosting with unlimited bandwidth, global CDN, automatic SSL, SPA mode. Cloudflare now recommends Workers over Pages for new projects. |
| API | Render Starter ($7/mo, Frankfurt) | Always-on Node process (needed for webhooks), health checks, logs, custom domain + SSL, flat price. The free tier sleeps after 15 minutes. |
| Database | MongoDB Atlas Flex (~$8/mo, capped at $30) | Managed, backups included, 5 GB. Free M0 has no backups: use it only for development/staging. |
| Email | Resend (free: 3,000/mo, 100/day) | Works with the existing SMTP code; move to Postmark ($15/mo) if delivery speed becomes critical. |
| Files | Cloudflare R2 (free up to 10 GB) | Logos survive redeploys; no download fees. |
| Errors | Sentry (free Developer plan) | Frontend and backend error reports. |
| Uptime | UptimeRobot or Better Stack (free) | Alerts if the site or API goes down. |

**Canonical domain:** `https://lunarbid.ai` (no www). `www.lunarbid.ai` permanently redirects to it. The HTML canonical tag, sitemap and Open Graph URLs already use the apex.

---

## 1. Domain and Cloudflare

1. Buy `lunarbid.ai`. The `.ai` registry requires a **2-year minimum** (about $140–165 total). Cloudflare Registrar sells at cost if it offers `.ai` in your account; otherwise Porkbun or Spaceship.
2. Create a free Cloudflare account and **add the site** `lunarbid.ai` (Free plan). If you bought the domain elsewhere, change its nameservers to the two Cloudflare gives you.
3. SSL/TLS → mode **Full (strict)**. Enable **Always Use HTTPS**.

## 2. Database — MongoDB Atlas

1. Create a project. Create a **Flex** cluster on **AWS, eu-central-1 (Frankfurt)** for production. (Optionally a free M0 cluster for staging.)
2. Database Access: a user with **readWrite on the `lunarbid` database only** and a long random password.
3. Network Access: add Render's outbound IP ranges for Frankfurt (Render dashboard → service → Connect → Outbound). If you can't, `0.0.0.0/0` with the strong password.
4. Connection string → `MONGODB_URI`, e.g. `mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/lunarbid?retryWrites=true&w=majority`
5. Alerts: enable the default project alerts (email).

The app creates its indexes automatically on start.

## 3. File storage — Cloudflare R2

1. R2 → Create bucket `lunarbid-files` (location hint: Europe).
2. Bucket → Settings → **Custom Domains** → `files.lunarbid.ai` (Cloudflare adds the DNS record).
3. R2 → Manage API tokens → token with **Object Read & Write** on this bucket only.
4. Values: `S3_BUCKET=lunarbid-files`, `S3_REGION=auto`, `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL=https://files.lunarbid.ai`.

## 4. Email — Resend

1. Add the domain `lunarbid.ai` in Resend (use the default `send` subdomain for the Return-Path).
2. Add the DNS records Resend shows **exactly as displayed** (SPF and MX on `send.lunarbid.ai`, DKIM TXT `resend._domainkey`). Wait until Resend shows *Verified*.
3. Add DMARC yourself: TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:dmarc@lunarbid.ai` (tighten to `p=quarantine` after a few weeks of clean reports).
4. Create an API key with **sending access** only.
5. SMTP values: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`, `SMTP_USER=resend`, `SMTP_PASSWORD=<API key>`, `EMAIL_FROM="LunarBid <no-reply@lunarbid.ai>"`.
6. To **receive** mail at `support@lunarbid.ai`: Cloudflare → Email → **Email Routing** (free) → forward to your inbox. It adds MX/SPF records on the apex, which don't conflict with Resend's `send` subdomain.

## 5. API — Render

1. Render → New → **Blueprint** → select the repository. It reads `render.yaml` (Frankfurt, Starter, health check `/health`).
2. Fill every variable marked `sync: false` (see *Environment variables* below). `JWT_SECRET` is generated automatically.
3. Settings → Custom Domains → add `api.lunarbid.ai`. In Cloudflare DNS add **CNAME `api` → `<service>.onrender.com`, DNS only (grey cloud)** so Render can issue the certificate.
4. Check `https://api.lunarbid.ai/health` → `{"status":"ok","db":true}`.
5. Render → Shell → `npm run ai:check` to confirm which AI providers and models respond. Replace failing models with the `*_MODEL` variables.

The API refuses to start in production if an essential setting is missing; the deploy log lists which.

## 6. Frontend — Cloudflare Workers

1. Cloudflare → Workers & Pages → Create → **Import a repository** → select it.
2. Root directory `frontend`; build command `npm run build`; deploy command `npx wrangler deploy`.
3. Build variables: `VITE_API_URL=https://api.lunarbid.ai/api`, optionally `VITE_SENTRY_DSN`.
4. Worker → Settings → Domains & Routes → **Custom domain** `lunarbid.ai`.
5. `www`: DNS → add `AAAA www 100::` (proxied). Rules → **Redirect Rules** → *Redirect from WWW to root* template (301, preserve path and query).
6. Every push to `main` redeploys automatically (GitHub Actions runs tests/lint/build in parallel).

Security headers (CSP, HSTS, frame protection) ship in `frontend/public/_headers`. The CSP allows connections only to `*.lunarbid.ai` and Sentry — keep the API and files on `lunarbid.ai` subdomains.

## 7. Payments

**Stripe cannot be used by a business registered in Cameroon.** The current code is Stripe-based; the decision is to move to **Paddle** (merchant of record: supports sellers in Cameroon, handles VAT worldwide; fees about 5% + $0.50 per transaction). Until the Paddle integration is built, the app shows "Online payments aren't available yet" when someone tries to upgrade — no one can be charged or granted a paid plan by mistake.

When Paddle is implemented, its webhook will be `https://api.lunarbid.ai/api/paddle/webhook`.

## 8. Google / GitHub sign-in (optional)

Leave the variables empty to keep it off (the buttons hide automatically). To enable, create OAuth apps with these callback URLs:
- Google: `https://api.lunarbid.ai/api/auth/google/callback`
- GitHub: `https://api.lunarbid.ai/api/auth/github/callback`

## 9. Monitoring

- Sentry: two projects (React + Node). `VITE_SENTRY_DSN` (frontend build variable) and `SENTRY_DSN` (Render). Add an alert rule for new issues.
- Uptime: monitors on `https://api.lunarbid.ai/health` and `https://lunarbid.ai` every 5 minutes, email alerts.
- Logs: Render → Logs (JSON lines in production). No passwords, tokens or email bodies are logged.

## 10. Staging (recommended)

A second Render service from a `staging` branch using the M0 cluster (`lunarbid-staging` database), with a Cloudflare preview or a second Worker at `staging.lunarbid.ai`. Add the staging frontend URL to the staging API's `CORS_ORIGINS`.

## 11. Backups

Atlas Flex includes automated snapshots. **Before launch, restore one into a temporary cluster** and check the data.

## Environment variables

**Frontend (Cloudflare build variables):** `VITE_API_URL`, `VITE_SENTRY_DSN` (optional). Both are public by nature; never put secrets in `VITE_` variables.

**Backend (Render):**

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` (set by render.yaml) |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | generated by Render |
| `FRONTEND_URL` | `https://lunarbid.ai` |
| `BACKEND_URL` | `https://api.lunarbid.ai` |
| `GROQ_API_KEY`, `OPENAI_API_KEY` (+ optional `TOGETHER_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`) | at least one; two recommended for fallback |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Resend values |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | R2 values |
| `SENTRY_DSN` | Sentry (Node project) |
| `STRIPE_*` | only while Stripe code remains; not usable from Cameroon |
| `GOOGLE_*`, `GITHUB_*` | optional |

## Go-live test

See `PRODUCTION_CHECKLIST.md`, section N.
