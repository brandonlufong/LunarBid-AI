# Deploying LunarBid

This guide takes LunarBid from the repository to a live site. Do the steps in order; each one produces a value the next ones need.

| Piece | Recommended service | Why |
|---|---|---|
| Frontend | **Netlify** (`netlify.toml` in the repo root) | Static hosting, previews for every branch |
| API | **Render** (`render.yaml` in the repo root) or any container host (`backend/Dockerfile`) | Node web service with health checks and zero-downtime deploys |
| Database | **MongoDB Atlas** | Managed MongoDB with automated backups |
| File storage (logos) | **Cloudflare R2** (or AWS S3, Backblaze B2, DigitalOcean Spaces) | Files survive redeploys; R2 has no download fees |
| Email | **Postmark**, **Resend** or **Amazon SES** over SMTP | Reliable delivery for password resets and sent proposals |
| Payments | **Stripe** | Checkout, Customer Portal, webhooks |
| Error tracking | **Sentry** | Alerts when something breaks |

Suggested domains: `lunarbid.ai` (frontend) and `api.lunarbid.ai` (API).

---

## 1. Database: MongoDB Atlas

1. Create a project and a cluster. **Choose a tier that includes automated backups**; free tiers usually do not back up your data.
2. Database Access: create a user with a long random password.
3. Network Access: allow your API host. Render publishes its outbound IP ranges; if you can't restrict by IP, use `0.0.0.0/0` together with the strong password.
4. Copy the connection string and use a database name in it: `mongodb+srv://USER:PASSWORD@cluster.xxxx.mongodb.net/lunarbid?retryWrites=true&w=majority` → `MONGODB_URI`.
5. Create a second database name for staging (`lunarbid-staging`), same cluster is fine to start.

## 2. File storage: Cloudflare R2

1. Create a bucket (e.g. `lunarbid-files`).
2. Make it publicly readable through a custom domain (e.g. `files.lunarbid.ai`) or the bucket's public `r2.dev` URL.
3. Create an API token with read/write access to that bucket.
4. Values for the API: `S3_BUCKET`, `S3_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`), `S3_REGION=auto`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (the public domain from step 2).

Other providers work the same way: for AWS S3 leave `S3_ENDPOINT` empty and set the real region.

## 3. Email: a transactional provider

1. Sign up with Postmark, Resend or Amazon SES and **verify the domain you send from** (e.g. `lunarbid.ai`). The provider shows DNS records to add:
   - **SPF** (TXT) and **DKIM** (TXT or CNAME) — required so mail isn't marked as spam.
   - **DMARC** (TXT at `_dmarc.lunarbid.ai`), start with `v=DMARC1; p=none; rua=mailto:you@lunarbid.ai`.
2. Create SMTP credentials. Values: `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM="LunarBid <no-reply@lunarbid.ai>"`.
3. Sent proposals use the freelancer's address as Reply-To, so clients' replies go straight to them.

## 4. API: Render

1. Render → **New → Blueprint** → select the GitHub repository. It reads `render.yaml` and creates `lunarbid-api`.
2. Fill in every variable marked "sync: false" (database, Stripe, AI keys, SMTP, S3, Sentry). `JWT_SECRET` is generated for you.
3. Set `FRONTEND_URL=https://lunarbid.ai` and `BACKEND_URL=https://api.lunarbid.ai`.
4. Add the custom domain `api.lunarbid.ai` and its DNS record.
5. Check: `https://api.lunarbid.ai/health` returns `{"status":"ok","db":true}`.
6. In the Render **Shell**, run `npm run ai:check` to confirm which AI providers and models work. Replace any failing model with the `*_MODEL` variables.

The API refuses to start in production if an essential setting is missing; the deploy log lists exactly which.

## 5. Frontend: Netlify

1. Netlify → **Add new site → Import an existing project** → select the repository. Build settings come from `netlify.toml` (base `frontend`, publish `dist`).
2. Environment variables: `VITE_API_URL=https://api.lunarbid.ai/api` and optionally `VITE_SENTRY_DSN`.
3. Add the domain `lunarbid.ai`. If the domain is different, also update the URLs in `frontend/index.html`, `frontend/public/robots.txt` and `frontend/public/sitemap.xml`.

## 6. Stripe

Follow the checklist in `PHASE1_CHANGES.md`: webhook endpoint `https://api.lunarbid.ai/api/stripe/webhook` with the listed events, Customer Portal with plan switching, failed-payment settings, and an end-to-end test in test mode before switching to live keys.

## 7. Google and GitHub sign-in (optional)

Leave the `GOOGLE_*` / `GITHUB_*` variables empty to keep social sign-in off. To enable, register an OAuth app with the provider and set its callback URL to `https://api.lunarbid.ai/api/auth/google/callback` (or `/github/callback`).

## 8. Error tracking: Sentry

Create two projects (Node and React) and set `SENTRY_DSN` on the API and `VITE_SENTRY_DSN` on Netlify. Set up an alert rule to email you on new issues.

## 9. Staging

Keep a staging copy so changes are tested before customers see them:

- **API**: a second Render service from the `staging` branch, with `MONGODB_URI` pointing at `lunarbid-staging`, **Stripe test keys**, and its own webhook endpoint in Stripe test mode.
- **Frontend**: Netlify branch deploys for `staging`, with `VITE_API_URL` pointing at the staging API (set per-branch in Netlify's environment variables).
- On the staging API, add the staging frontend's address to `CORS_ORIGINS`.

Workflow: merge into `staging`, check it, then merge `staging` into `main`. GitHub Actions (`.github/workflows/ci.yml`) runs the tests, lint and build on every push and pull request.

## 10. Backups and restore

- Atlas takes automatic snapshots on tiers with backups; confirm the schedule and retention in the cluster's Backup tab.
- **Do a restore drill before launch**: restore the latest snapshot into a temporary cluster and check the data. A backup you have never restored is not yet a backup.
- Files in R2 are not versioned by default; logos are replaceable, but you can enable bucket versioning if you prefer.

## Launch checklist

- [ ] `/health` is ok on the production API
- [ ] `npm run ai:check` passes for at least two providers
- [ ] Sign up, confirm the email from the link you receive, check a password reset email arrives, sign in
- [ ] Generate a proposal, analyze a job post, send a proposal to your own email address
- [ ] Buy Starter with a real card, see the plan activate, open Manage billing, cancel, request a refund of your own test charge
- [ ] Upload a logo and see it on a shared proposal link
- [ ] Export your data, then delete a test account
- [ ] A test error appears in Sentry
- [ ] Terms, Privacy and Refund pages reviewed by counsel; support email confirmed
- [ ] A backup restore has been tested
