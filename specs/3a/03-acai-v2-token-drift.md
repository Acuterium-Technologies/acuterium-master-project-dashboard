# Spec 3a.03 · ACAI V2 Token Drift Fix

**Sub-phase:** 3a
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved for implementation
**Estimated time:** 15 min

---

## Why

ACAI V2 conformance audit (F-04, filed 2026-05-21) identified token drift between the canonical ACAI V2 design system and the current build:

| Token | Current (live) | Canon | Status |
|---|---|---|---|
| `--radius-lg` | `18px` | `22px` | ❌ DRIFT |
| `--breath-stressed` | missing | `2.8s` | ❌ MISSING |
| `--breath-calm` | missing | `4.8s` | ❌ MISSING |
| `--orb-drift` | missing | `14s` | ❌ MISSING |
| `--bg-gov` | missing | `#B8D4E8` | ❌ MISSING (Gov Edition) |
| `--text-gov-primary` | missing | `#1A4F6A` | ❌ MISSING |
| `--text-gov-secondary` | missing | `#2F7090` | ❌ MISSING |
| `--text-gov-muted` | missing | `#6A9EB8` | ❌ MISSING |
| `--glass-gov-outer` | missing | `rgba(255, 255, 255, 0.42)` | ❌ MISSING |
| `--glass-gov-panel` | missing | `rgba(255, 255, 255, 0.32)` | ❌ MISSING |
| `--glass-gov-item` | missing | `rgba(255, 255, 255, 0.22)` | ❌ MISSING |
| `--border-gov` | missing | `rgba(255, 255, 255, 0.60)` | ❌ MISSING |

Government Edition styling (RUZN.AI judicial sessions, formal document review) cannot be properly styled without the `gov-` token family.

## Out of scope (Phase 3b)

- Wiring Government Edition mode switch UI (toggle button in nav)
- Cinzel serif headings in Government Edition pages (data exists in token; HTML/JSX changes are Phase 3b)
- Arabic RTL layout adjustments (Phase 3c via CHRONOS)

## Implementation

**Single file change:** `src/styles/master-ops.css`

Locate the `:root` block (currently at line ~14). Apply these changes:

### Change 1 — Fix `--radius-lg` drift

```diff
-  --radius-lg: 18px; --radius-md: 12px; --radius-sm: 8px; --radius-pill: 100px;
+  --radius-lg: 22px; --radius-md: 12px; --radius-sm: 8px; --radius-pill: 100px;
```

### Change 2 — Add missing breath + orb tokens

Add immediately after the existing `--breath-rate` line:

```css
  --breath-normal:   4.2s;
  --breath-stressed: 2.8s;
  --breath-calm:     4.8s;
  --orb-drift:       14s;
```

(Existing `--breath-rate: 4.2s;` stays — it's the *active* PATHOS-driven var; the new normal/stressed/calm are the named targets the engine selects between.)

Update `src/engines/kairos.ts` (or wherever breath rate is computed — find via grep) to use the new named tokens:

```typescript
function computeBreathRate(pathos: PathosState): string {
  if (pathos.stress > 70) return 'var(--breath-stressed)';
  if (pathos.stress < 30) return 'var(--breath-calm)';
  return 'var(--breath-normal)';
}

// Apply to root element
document.documentElement.style.setProperty('--breath-rate', computeBreathRate(pathos));
```

### Change 3 — Add Government Edition tokens

Add a new block inside `:root` after the existing dark-edition tokens:

```css
  /* ── GOVERNMENT EDITION (RUZN.AI · judicial · formal doc review) ── */
  --bg-gov:              #B8D4E8;
  --text-gov-primary:    #1A4F6A;
  --text-gov-secondary:  #2F7090;
  --text-gov-muted:      #6A9EB8;
  --glass-gov-outer:     rgba(255, 255, 255, 0.42);
  --glass-gov-panel:     rgba(255, 255, 255, 0.32);
  --glass-gov-item:      rgba(255, 255, 255, 0.22);
  --border-gov:          rgba(255, 255, 255, 0.60);
```

### Change 4 — GUI Classic mode wiring (closes a gap in current build)

The existing `body.mode-gui` styles in master-ops.css don't currently use the gov tokens. Update them to use the new tokens (these rules likely already exist — verify via grep and update in place):

```css
body.mode-gui {
  background: var(--bg-gov);
}

body.mode-gui h1,
body.mode-gui h2,
body.mode-gui h3 {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text-gov-primary);
  letter-spacing: 0.04em;
}

body.mode-gui .glass-panel,
body.mode-gui .panel {
  background: var(--glass-gov-panel);
  border: 1px solid var(--border-gov);
  color: var(--text-gov-secondary);
}

body.mode-gui .panel-title,
body.mode-gui .text-muted {
  color: var(--text-gov-muted);
}
```

## Preflight rule 7.16 LOAD-BEARING

This sub-spec touches CSS. Postmortem CA-2 rule applies:

> Any new `body.mode-X .selector { ... }` override MUST have a base `.selector { ... }` rule already defined OR added in the same commit.

For this spec: `body.mode-gui .panel-title` requires `.panel-title { ... }` base — verify it exists before commit, add if missing.

Verify via:
```bash
grep -nE '^\s*\.(panel|panel-title|text-muted|glass-panel)\s*\{' src/styles/master-ops.css
```

If any selector is missing a base rule, add a minimal default before the mode-gui override.

## Doctrinal red-lines

- All 12 new tokens land in `:root` (not in mode-specific blocks) so they're available globally
- Token names match ACAI V2 canon EXACTLY (no shortening, no renaming)
- Glass transparency stays in 45–55% range (no token violates this)
- No new Google Fonts CDN loads (Cinzel + Sora + JetBrains Mono are already self-hosted in `/public/fonts/`)
- Existing `body.mode-aui`, `body.mode-hud`, `body.mode-tuui`, `body.mode-dashboard`, `body.mode-ambient` rules are NOT touched (they're correct)
- Preflight rule 7.16 (base-CSS-before-override) honored

## Tests

No new Vitest needed — this is a token-only change. Verify via:

1. `npm run build` clean
2. DevTools → Elements → `<html>` computed styles show all 12 new tokens
3. Live dashboard `body.mode-gui` renders with light blue (`#B8D4E8`) background and dark blue text
4. Playwright spec from sub-spec 3a.05 captures Government Edition screenshot for visual regression

## Acceptance criteria

- [ ] All 12 token changes in `:root`
- [ ] `--radius-lg` is `22px` (not 18px)
- [ ] `--breath-rate` is driven by `computeBreathRate(pathos)` using the new normal/stressed/calm vars
- [ ] `body.mode-gui` uses Government Edition tokens
- [ ] Preflight 7.16 verifies base CSS for every new `mode-gui` override
- [ ] DevTools confirms all 12 new tokens computed correctly
- [ ] No regression in AUI, HUD, TUUI, Dashboard, Ambient modes (visual regression tests pass)
- [ ] Bundle delta < +1 kB
