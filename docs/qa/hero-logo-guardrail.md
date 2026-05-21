# Hero Logo QA Guardrail

**Source of truth:** repo-ready-implementation-logo-fix-1.md (lines 364-401)
**Closes:** F-07 from the 2026-05-21 logo-fix audit
**Doctrinal alignment:** D-08 (visual extension), D-11 (L5 output discipline)

This checklist is the PR-review hard gate for any change touching the hero brand surface. Reviewers MUST tick every box before approving a PR that modifies `HeroBrandLockup.tsx`, `hero-brand-lockup.css`, or any page rendering the hero.

---

## Structural checks

- [ ] Hero logo uses `HeroBrandLockup` or approved successor component only.
- [ ] Logo is placed inside the canonical `.acu-hero-lockup__logo-frame`.
- [ ] No page-level inline width/height overrides are applied to the hero logo.
- [ ] Dashboard pages use only approved variants: `compact` or `standard`.
- [ ] `prominent` is forbidden for operational dashboard surfaces unless explicitly approved.

## Proportion checks

- [ ] Logo does not visually dominate the main title.
- [ ] Logo frame size matches token rules for current breakpoint.
- [ ] Logo preserves aspect ratio with `object-fit: contain`.
- [ ] Hero text block remains the primary visual anchor.
- [ ] Spacing between logo and title block is balanced at desktop and mobile.

## Alignment checks

- [ ] Logo aligns to the headline group, not to the full hero container height.
- [ ] Top edge, centerline, and optical balance look correct at 1440px, 1024px, 768px, 430px, and 390px.
- [ ] No floating, sagging, or oversized appearance in two-column layout.
- [ ] Mobile stack still feels proportional after collapse.

## Responsive checks

- [ ] Desktop variant verified.
- [ ] Tablet variant verified.
- [ ] Mobile variant verified.
- [ ] No text collision, overflow, or excessive whitespace around the logo.
- [ ] Hero remains readable and balanced in dark mode and light mode if supported.

## Regression checks

- [ ] Screenshot baseline updated only if change is intentional.
- [ ] Visual regression run passes for hero region at all required breakpoints.
- [ ] Reviewer explicitly confirms "logo proportionality and alignment passed".

## Release rule

- [ ] **Do not merge if hero logo exceeds approved token size or fails screenshot review.**

---

## Automated counterpart

The `tests/hero-brand.spec.ts` Playwright suite enforces the proportion + alignment checks programmatically at 5 viewports. This checklist is the **human review layer** on top of that — for things screenshots can miss (intent, brand feel, hierarchy).

Run the automated suite via:

```bash
npm run test:visual
```

If screenshots have drifted intentionally, update baselines:

```bash
npm run test:visual -- --update-snapshots
```

---

*Acuterium Technologies Inc. · Hero Logo QA Guardrail · TS//SOVEREIGN*
*Doctrine: Perplexity Commands · Claude Engineers · Codex Specialises · Sovereignty Delivers*
