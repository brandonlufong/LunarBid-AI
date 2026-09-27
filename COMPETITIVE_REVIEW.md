# LunarBid — Competitive benchmark, pricing review and final polish

26 September 2026. All test results below were produced in this round (see J).

## A. Executive summary

LunarBid's real competitors are **not** PandaDoc, Proposify or Qwilr (sales-document platforms priced per seat, $19–65/user) nor Bonsai/HoneyBook (freelancer business suites, $25–129/month). The products that compete for the same moment — *a freelancer reading a job post and deciding what to send* — are **Upwork's own AI (Uma, full access in Freelancer Plus at $19.99/month)** and **AI proposal tools at roughly $5–35/month** (e.g. AiProposer: 2 free proposals/day, paid from $12).

Against that market, LunarBid's **prices ($12 / $19) are right**. What needed fixing was the **structure**: the Free plan allowed ~150 proposals/month (5/day, no monthly cap) — three times paid Starter's 50/month — and Pro advertised a benefit ("longer, more detailed drafts") the code barely delivers. Both are fixed. Recommendation: **minor modifications** (section L).

Also this round: the desktop profile menu (opening off-screen) is fixed; the landing page gained restrained, reduced-motion-safe animation; the NWEE site now describes LunarBid accurately and presents NWEE as a technology/product company first.

## B. Competitive benchmark

Monthly price (annual price in brackets) for the plan a solo user would buy. Verified September 2026 from the sources listed.

| Product | Positioning | Free | Entry | Mid | Team/Agency | Limits / notes |
|---|---|---|---|---|---|---|
| **LunarBid (after this round)** | AI freelance proposals | 10 proposals/month | $12 — 50/month | $19 — unlimited (fair use 100/day) | Agency: coming soon | Per account, no seats |
| Upwork Freelancer Plus [1] | Marketplace membership incl. AI | Uma limited (~10 msgs/week) | $19.99 (100 Connects, full Uma) | — | Agency Plus $20 | AI tied to Upwork only |
| AiProposer [2] | AI Upwork proposals | 2/day | from $12 | — | — | Closest direct competitor |
| Proposify [3] | Sales-team proposal platform | none (14-day trial) | $29 ($19)/user — 10 sends/mo, $0.50 overage | $49 ($41)/user — 30 sends | Business from $3,900/yr | Per user |
| Better Proposals [4] | Document platform | none (14-day trial) | $19 ($13)/user | $29 ($21)/user | $49 ($42)/user | Starter send cap (sources differ: 10–50/mo) |
| PandaDoc [5] | Document workflow / e-sign | Free eSign, ~5 docs/mo | $35 ($19)/seat | $65 ($49)/seat | Enterprise custom | Per seat |
| Qwilr [6] | Interactive sales pages | none (14-day trial) | $39 ($35)/user | — | $59/user, 10-seat minimum | Premium-priced |
| Bonsai [7] | Freelancer business suite | none (7-day trial) | $25 ($19) for proposals + invoicing | $39 ($29) | $59 ($49), 3-user minimum | Basic $15 excludes proposals |
| HoneyBook [8] | Freelancer business suite | none (7-day trial) | $36 ($29) | $59 ($49) | $129 ($109) | Raised prices in Feb 2025 |
| Prospero / Bidsketch [9] | Simple proposal tools | trial | ~$10 / from $23 | — | — | Templates, e-sign |

**What successful competitors do:** document platforms monetise per seat and gate volume by *sends*; suites bundle contracts/invoices/payments; nobody in the document category offers a meaningful free tier. AI proposal tools offer a small free allowance and a flat low monthly price. Annual discounts of 20–45% are standard.

## C. LunarBid pricing assessment

| Decision | Verdict | Why |
|---|---|---|
| Starter $12 / Pro $19 | **KEEP** | Matches the AI-proposal niche ($12–20) and Upwork Freelancer Plus ($19.99). Competing on price below this isn't needed; competing with $19–65 per-seat document tools isn't the market. |
| Free = 5/day with no monthly cap (~150/month) | **MODIFY → 10/month** (done) | Free out-produced paid Starter 3×. 10/month still exceeds PandaDoc's free docs and lets a freelancer try LunarBid on real bids for a couple of weeks. |
| Free job analyses 10/day | **MODIFY → 5/day** (done) | Analyses cost about the same as a draft; 5/day keeps the "understand the job" value visible without subsidising heavy use. |
| Starter 50/month | **KEEP** | Covers weekly bidding (Upwork's 100 Connects ≈ 5–6 proposals/week on Freelancer Plus). |
| Pro "unlimited" with no ceiling | **MODIFY → fair use 100/day, disclosed** (done) | Bounds AI cost per account; far above manual bidding. |
| "Longer, more detailed drafts" (Pro) | **REMOVE** (done) | Code difference is 2,000 vs 2,500 output tokens; both already fit the longest length option. |
| Agency $49 | **KEEP as "Coming soon"** | Team seats, shared clients and white-label don't exist. Selling it would be selling features we don't have. |
| Annual billing (~2 months free: $120 / $190 per year) | **ADD LATER** (with Paddle) | Standard in the market (20–45% discounts). Needs the billing integration first. |
| Regional pricing for emerging markets | **ADD LATER** (Paddle localized prices) | $12 is meaningful for many freelancers in Cameroon/West Africa; test a lower regional price once payments work. |
| Separate AI credits | **DO NOT ADD (now)** | "Proposals" is a unit users understand. Regenerating visibly uses one proposal. Revisit only if usage data shows abuse. |
| Payments UI | **KEEP "Online payments aren't available yet"** | Stays until Paddle is implemented and tested. |

Economics: at current small-model prices a proposal costs well under a cent in AI tokens (verify with your providers' current pricing); the fair-use cap keeps a single Pro account's worst case bounded.

## D. Product differentiation — what LunarBid should own

**"Give LunarBid the job post; it helps you build the proposal."** Specifically:
1. **Understanding before writing** — the Job Analyzer (requirements, the client's real needs, red flags, angles). Document platforms don't do this; generic AI doesn't structure it.
2. **Honest, profile-grounded drafts** — only the experience you listed; fallback templates labelled. This is a trust differentiator against "generate anything" tools.
3. **Proposal performance (later)** — Won/Lost tracking now feeds real analytics (win rate, by tone, monthly trend, response time). It becomes a differentiator only with volume; don't claim insight we don't have.

| Horizon | Items |
|---|---|
| **NOW** (core) | Job analysis, tailored drafts, tone/length, edit/save/export/share/email, history with Won/Lost |
| **NEXT** | Proposal quality check (flag vague claims, missing next step) · reusable personal snippets (portfolio lines, rates) · browser extension to capture job posts · Paddle billing + annual plans |
| **LATER** | Team seats and shared clients (reopen Agency) · per-platform guidance · insights across the user's own history |
| **DO NOT ADD** | Invoicing, contracts, e-signatures, payment collection, CRM, project management, AI chatbots/agents — these turn LunarBid into Bonsai/PandaDoc and dilute the one clear problem it solves |

## E. UI/UX changes made

- Account menu opens upward when there's no room below (all menus).
- Pricing: clear progression (Free 10/month → Starter 50/month → Pro unlimited with fair use); taglines say who each plan is for; new "What happens when I reach my limit?" answer (nothing is lost; generate again after reset or upgrade).
- Limit messages only suggest upgrading when a higher plan exists; Pro users hitting fair use are told when it resets.
- Usage meters show Free as monthly, Pro as "unlimited (fair use)".
- Landing: four-step workflow ending in "Track what wins"; "Free plan with 10 proposals a month" note.
- Sign-in: Google/GitHub buttons appear automatically when the server has credentials (verified with and without); unchanged behaviour, explained in G of the previous report.

## F. Profile menu bug — root cause and fix

**Root cause:** the dropdown always opened *below* its trigger. On desktop the trigger (user name) sits at the bottom of the fixed sidebar, so the menu rendered below the viewport — measured top edge at 894 px on a 900 px-tall screen (1440×900) and 794 px on 800 px (1280×800). On mobile the trigger is in the top bar, so it opened into view. Not a z-index, clipping or stacking problem.
**Fix:** `Menu` measures available space before paint and opens upward when there isn't room below (`side="auto"`). Verified visible and keyboard-navigable at 1440, 1280, 1024, 768 and 390 px, light and dark; axe on the open menu: 0 violations.

## G. Landing-page motion

CSS transitions + IntersectionObserver (no library; +1 KB gzip): staggered hero entrance; product visual settles in with a slow ambient glow; section/card reveals with stagger; workflow connector draws in; header tightens and gains a border/shadow on scroll; subtle parallax on the product visual (desktop only, capped at ±24 px); gentle hover lift on cards. No scroll-jacking, no infinite motion except the slow glow. **Measured layout shift: 0.** With `prefers-reduced-motion`, nothing is hidden or animated (verified: 0 of 27 elements hidden). A 4-second safety net reveals everything if the observer never fires.

## H. NWEE changes (LunarBid-related)

- Tagline everywhere: **"Win more freelance bids with AI."** (product line, SEO schema, hero note, LunarBid page).
- Removed outdated/overstated claims: "Stripe billing" (×2), "subscriptions" (×2), analytics "by industry… revenue trends", client "history", "Google and GitHub sign-in" as standard, Agency in the plan list, "in minutes instead of hours".
- Updated features to the current product: drafts from your real profile, edit/save/email, rate calculator with platform fee, win-rate analytics by tone.
- **lunarbid.ai isn't live yet:** no links to it until `VITE_LUNARBID_LIVE=true`. CTAs become "Talk to us about LunarBid" (contact form), footer shows "lunarbid.ai · launching soon", pricing sentence says it will be published at launch. Prevented a crash: the LunarBid page parsed the (now empty) URL.
- Contact: the LunarBid option shows a normal form before launch (it would otherwise have had no fields); fixed a pre-existing hydration error on `?intent=` links.
- Status stays **"In development"**; no traction, users or revenue claimed.

## I. Previous NWEE review items

| Item | Status |
|---|---|
| A. Avoid looking like a web agency | **Resolved** — hero, meta and footer lead with "technology company… intelligent software, platforms and connected systems"; LunarBid and the connected-intelligence section now come before the service menu. |
| B. Digital Experiences | **Resolved without removal** — moved from 01 to 04; rewritten as "the public face of products, platforms and organizations", connected to the systems behind them. |
| C. Technology/product hierarchy | **Resolved** — practices ordered Web Platforms & SaaS → Enterprise Software → Mobile → Digital Experiences; intro "Platforms and systems first, with the websites and apps that are their public face." |
| D. Product-company identity | **Kept and strengthened** — "The habits of a product company, applied to the systems we build for others." unchanged; LunarBid shown second on the page. |
| E. Visual hierarchy | **Resolved** (order and emphasis; no redesign) |
| F. LunarBid as proof | **Resolved** — "Built by NWEE · In development · Win more freelance bids with AI" with the product UI, before services. |
| G. "Built for real networks" | **Preserved** unchanged. |
| H. Positioning test | First two screens: "Connected Intelligence" → "NWEE is a technology company…" → capability band (AI, Cloud & Data, …) → LunarBid product → "Intelligence is only useful when it is connected." A first-time visitor sees a technology/product company; websites appear as one of four practices. |
| Outstanding | NWEE contact email is still `hello@nwee.example` and some `config/site.js` TODOs remain (domain, WhatsApp, registration number) — need your details. |

## J. Tests (run this round)

- LunarBid backend: **51/51** (`npm test`), including new pricing-structure and fair-use tests.
- LunarBid frontend: lint **0 errors**; build OK; main bundle **149 KB gzip**.
- End-to-end on the dev server: **23/23** flows, 0 console errors.
- Accessibility (axe, WCAG 2.1 A/AA incl. contrast): **0 violations** light and dark on 19 screens; open account menu **0** in both themes.
- Screen sweep: English **114/114** clean (19 screens × 6 widths); French **68/68** clean (4 widths).
- Profile menu: visible at 1440/1280/1024/768/390 px; keyboard focus enters the menu.
- Landing motion: layout shift 0; reduced motion hides 0 elements; scroll reveals verified.
- OAuth buttons: shown with credentials, hidden without (login and register).
- NWEE: build prerenders 34 routes; French **0 missing**; responsive sweep **60/60** clean (6 pages × 5 widths × EN/FR); no links to lunarbid.ai before launch; contact LunarBid intent shows name/email/message.

## K. Remaining launch blockers

- **Code:** Paddle billing integration (checkout, webhooks, customer portal, annual plans) — after you open the Paddle account.
- **Purchases/accounts:** lunarbid.ai domain, Render, MongoDB Atlas, AI provider credit; free accounts for Cloudflare, Resend, Sentry, uptime monitor.
- **Credentials:** all variables in `PRODUCTION_CHECKLIST.md` §E; optional Google/GitHub OAuth apps.
- **Paddle/payment:** seller verification with Paddle, product/price setup (monthly now, annual later).
- **Legal review:** Terms, Privacy, Refund pages; confirm support@lunarbid.ai.
- **Optional:** regional pricing experiment; NWEE site TODOs (contact details, registration number).

## L. Final recommendation

**Minor modifications — already applied.** The research shows LunarBid is priced where its real competitors are (Upwork's AI at $19.99; AI proposal tools at $12–20), and its focus — understanding the job post and writing honestly from the user's real profile — is a genuine gap between generic AI and $19–65/seat document platforms. The plan *structure* had two defects (Free above Starter; an unsupported Pro claim) and one risk (uncapped Pro); those are fixed. Keep the prices, keep Agency closed, add annual and regional pricing with Paddle, and resist adding invoicing/contracts/CRM.

## Sources
1. Upwork — https://www.upwork.com/resources/is-upwork-free ; https://www.upwork.com/uma
2. AiProposer — https://aiproposer.com/best-ai-upwork-proposal-generator
3. Proposify — https://www.proposify.com/pricing ; https://myproposer.com/blog/proposify-pricing
4. Better Proposals — https://www.xpay.sh/saas-pricing/better-proposals-io/ ; https://getpulsesignal.com/pricing/betterproposals ; https://www.capterra.com/p/153794/Better-Proposals/
5. PandaDoc — https://eversign.com/blog/pandadoc-pricing-guide ; https://bindlegal.com/resources/comparisons/pandadoc-pricing-2026/
6. Qwilr — https://verdocs.com/blog/qwilr-pricing ; https://www.capterra.com/p/143254/Qwilr/
7. Bonsai — https://www.raoura.com/blog/bonsai-pricing ; https://agiled.app/blog/bonsai-review
8. HoneyBook — https://agiled.app/blog/honeybook-pricing ; https://assembly.com/blog/honeybook-pricing
9. Bidsketch/Prospero — https://www.proposify.com/blog/bidsketch-pricing ; https://goprospero.com/blog/fresh-proposals-alternatives-create-beautiful-proposals/
