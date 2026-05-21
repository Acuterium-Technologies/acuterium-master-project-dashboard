# Pull Request

## Summary
<!-- 1-3 bullet points describing what this PR does and why -->

## Doctrinal preflight

- [ ] No `manus-sdk` / `@manus` / `manus_api` / `manus.ai` / `manus-cli` references introduced.
- [ ] No `TODO:` / `FIXME:` / `placeholder` / `your_api_key` strings in new `src/` code.
- [ ] Diacritics preserved: Mārel · NAHRĀ · ZemarōnOS · Finariah-ASI · M-PCB.
- [ ] D-01 .. D-12 doctrine ids and `classKey` values unchanged.
- [ ] Glass transparency held at 45–55 %, never opaque.
- [ ] No external chart libraries imported — hand-rolled SVG only.
- [ ] No Google Fonts CDN at runtime — self-host via `/fonts/` only.
- [ ] Leak-fix middleware at `58b61d1` not regressed (carve-out list extended, not replaced).

## Hero brand surface check (Phase 3a)

If this PR touches `src/components/brand/`, `src/styles/hero-brand-lockup.css`, or any page rendering the hero:

- [ ] Hero Logo QA Guardrail completed: [docs/qa/hero-logo-guardrail.md](../docs/qa/hero-logo-guardrail.md)
- [ ] Playwright visual regression run locally: `npm run test:visual` (or `:update` if baselines intentionally moved)
- [ ] Screenshot baselines under `tests/hero-brand.spec.ts-snapshots/` reflect the intended state

If this PR does NOT touch the hero brand surface, tick this box: [ ] N/A — hero surface untouched

---

## Hero Logo QA Guardrail

### Structural checks
- [ ] Hero logo uses `HeroBrandLockup` or approved successor component only.
- [ ] Logo is placed inside the canonical `.acu-hero-lockup__logo-frame`.
- [ ] No page-level inline width/height overrides applied to the hero logo.
- [ ] Dashboard pages use only approved variants: `compact` or `standard`.
- [ ] `prominent` is forbidden for operational dashboard surfaces unless explicitly approved.

### Proportion checks
- [ ] Logo does not visually dominate the main title.
- [ ] Logo frame size matches token rules for current breakpoint.
- [ ] Logo preserves aspect ratio with `object-fit: contain`.
- [ ] Hero text block remains the primary visual anchor.
- [ ] Spacing between logo and title block is balanced at desktop and mobile.

### Alignment checks
- [ ] Logo aligns to the headline group, not to the full hero container height.
- [ ] Top edge, centerline, and optical balance look correct at 1440 / 1024 / 768 / 430 / 390 px.
- [ ] No floating, sagging, or oversized appearance in two-column layout.
- [ ] Mobile stack still feels proportional after collapse.

### Responsive checks
- [ ] Desktop variant verified.
- [ ] Tablet variant verified.
- [ ] Mobile variant verified.
- [ ] No text collision, overflow, or excessive whitespace around the logo.

### Regression checks
- [ ] Screenshot baseline updated only if change is intentional.
- [ ] Visual regression run passes for hero region at all required breakpoints.
- [ ] Reviewer explicitly confirms "logo proportionality and alignment passed".

### Release rule
- [ ] **Do not merge if hero logo exceeds approved token size or fails screenshot review.**

## Verification

- [ ] `npm run typecheck` clean.
- [ ] `npm run build` succeeds.
- [ ] Live QA on `master-project.acuterium.ai` if this changes the gated surface.

## Test plan

<!-- Markdown checklist of TODOs for testing the PR -->
- [ ]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
