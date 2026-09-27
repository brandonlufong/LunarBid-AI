# LunarBid design system

**Character:** calm, precise, document-first. AI is part of the workflow, not the visual identity.
**Relationship to NWEE:** LunarBid uses NWEE's product indigo and, for documents only, NWEE's serif (Newsreader). Everything else is LunarBid's own.

## Tokens (`frontend/src/index.css`)
Semantic colors switch automatically with the theme — use the utilities, never raw hex or `darkMode ?` conditionals:

| Purpose | Utilities |
|---|---|
| Page / surfaces | `bg-page`, `bg-surface`, `bg-subtle`, `bg-sunken` |
| Text | `text-fg` (primary), `text-fg-2` (secondary), `text-muted` (captions, hints) |
| Borders | `border-line`, `border-line-strong` |
| Accent (indigo) | `bg-accent`, `hover:bg-accent-hover`, `text-accent-fg`, `bg-accent-soft`, `text-accent-text` |
| Status | `text-success/warning/danger`, `bg-success-soft/…` |
| Elevation | `shadow-xs`, `shadow-card`, `shadow-pop`, `shadow-modal` |

- **Type:** Inter Variable for the interface; Newsreader Variable (`font-document`, `.prose-document`) for proposals and marketing headlines. Scale: `text-caption` 12 · `text-small` 13 · `text-body` 14 · `text-body-lg` 16 · `text-h3` 16 · `text-h2` 18 · `text-h1` 24 · `text-display` 36 · `text-hero` 52.
- **Radius:** 6 (controls) · 8 (buttons, inputs) · 12 (cards) · 16 (dialogs).
- **Spacing:** 4px grid. Cards `p-5 sm:p-6`; page `px-4 sm:px-6 lg:px-10`; section gaps `gap-6`.
- **Motion:** 140–160 ms entrances (`animate-pop`, `animate-fade`), skeleton shimmer; all disabled with `prefers-reduced-motion`.

## Components (`frontend/src/components/ui`)
`Button` / `IconButton` (label required) · `Field` + `Input` / `Textarea` / `Select` (wires label, hint, error, counter) · `Card`, `CardHeader` · `Badge` · `Alert` · `Modal` (focus trap, Escape, focus return) · `EmptyState` · `Skeleton` · `PageHeader` · `Segmented` (radio group, arrow keys) · `Menu` (keyboard dropdown) · `UsageMeter` · `Avatar`.
App: `AppShell` (sidebar / mobile drawer), `Logo`. Proposals: `ProposalDocument`, `AnalysisPanel`, `SendDialog`.

## Rules
1. Only show what the backend really does: no invented stats, stages, testimonials or features. Plan features come from `/subscription/plans` (`components/billing/planLines.js`).
2. Every control has a visible label or an accessible name; icon-only buttons use `IconButton`.
3. New text goes in both `en` and `fr` (`node scripts/merge-locale.mjs additions.json`).
4. Verify with `qa/` scripts: screens at 6 widths, axe (0 violations light/dark), end-to-end flows on the dev server.
