# Spec 3a.06 · QA Checklist Markdown

**Sub-phase:** 3a
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved · canonical doc already in bundle
**Estimated time:** 10 min

---

## Why

Closes **F-07** from the 2026-05-21 logo-fix audit. The QA checklist was specified in `repo-ready-implementation-logo-fix-1.md` lines 364-401 but never anchored in the repo at `docs/qa/hero-logo-guardrail.md`. Reviewers have no canonical PR-review gate to follow.

## Implementation

### File 1 · `docs/qa/hero-logo-guardrail.md`

**Source file in this bundle:** `docs/qa/hero-logo-guardrail.md` — copy verbatim to repo. Creates the `docs/` and `docs/qa/` directories at repo root.

5 section blocks (Structural · Proportion · Alignment · Responsive · Regression) + a Release Rule.

### File 2 · `README.md` link

Add a section under "Documentation" (or near the bottom):

```markdown
## QA & Compliance Documentation

- [Hero Logo QA Guardrail](docs/qa/hero-logo-guardrail.md) — PR-review gate for hero brand surface changes
```

### File 3 · `DEPLOYMENT-GUIDE.md` link

Add to the pre-deployment checklist:

```markdown
- [ ] If hero brand surface was touched, hero logo QA guardrail run: docs/qa/hero-logo-guardrail.md
```

### File 4 · `.github/pull_request_template.md` (NEW or extend existing)

Add a "Hero Logo" section to the PR template:

```markdown
## Hero brand surface check

If this PR touches `src/components/brand/`, `src/styles/hero-brand-lockup.css`, or any page rendering the hero:

- [ ] Hero Logo QA Guardrail completed: docs/qa/hero-logo-guardrail.md
- [ ] Playwright visual regression run locally: `npm run test:visual`
- [ ] Screenshot baselines updated only if change is intentional

If this PR does NOT touch the hero brand surface, tick this box: [ ] N/A
```

If a `.github/pull_request_template.md` already exists, splice the section in without removing existing content.

## Doctrinal red-lines

- Checklist content MUST match `repo-ready-implementation-logo-fix-1.md` lines 364-401 verbatim
- The Release Rule MUST be the last item: "Do not merge if hero logo exceeds approved token size or fails screenshot review"
- The doc MUST link to its automated counterpart (`tests/hero-brand.spec.ts`)
- Markdown checkboxes MUST use the `- [ ]` syntax (GitHub-compatible)

## Acceptance criteria

- [ ] `docs/qa/hero-logo-guardrail.md` lives in repo (verbatim from bundle)
- [ ] `README.md` links to it under a "QA & Compliance Documentation" section
- [ ] `DEPLOYMENT-GUIDE.md` includes the hero guardrail step in its pre-deploy checklist
- [ ] `.github/pull_request_template.md` has the Hero brand surface check section
- [ ] All 4 files render correctly on github.com
