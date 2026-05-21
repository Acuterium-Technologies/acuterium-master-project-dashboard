# Spec 3c.03 · Particle Density Variance Per Mode

**Sub-phase:** 3c
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 25 min
**Closes:** ACAI V2 conformance · Particle density variance per mode 40% → 100%

---

## Why

ACAI V2 canon specifies particle density variance per mode:
- **AUI Glass** · 1× baseline (default)
- **Ambient** · 3× density (becomes the dominant visual layer)
- **HUD** · 0.3× density (minimal, monochrome telemetry feel)
- **TUUI** · 1.5× density (subtle increase to emphasize touch surface)
- **GUI Classic** · 0.5× density (minimal animation, ordered feel)
- **Dashboard** · 1× density (balanced BI grid)

Current `ParticleNetwork` class in the codebase varies particle opacity per mode but **not particle count**. Phase 3c.03 fixes that.

## Out of scope

- WebGL acceleration (particle count <200 doesn't need it)
- Per-particle gradient coloring (Phase 4+ candidate)
- Particle trails / motion blur (Phase 4+)

## Implementation

### Locate existing ParticleNetwork

Find via `grep` in `src/`. Likely at `src/engines/particle-network.ts` or `src/components/ParticleNetwork.tsx`. If the class is structured per the ACAI V2 skill spec, it already has a `setMode()` method that takes a mode and reinitializes particles. Phase 3c.03 just needs to:

1. Modify the `particleCount()` calculation to use a mode multiplier
2. Wire `setMode()` to be called whenever KAIROS mode changes

### Mode multipliers (canon)

```typescript
const MODE_DENSITY_MULTIPLIERS: Record<KairosMode, number> = {
  aui:       1.0,
  ambient:   3.0,
  hud:       0.3,
  tuui:      1.5,
  gui:       0.5,
  dashboard: 1.0,
};
```

### `src/engines/particle-network.ts` (or current location)

Update the `particleCount()` method:

```typescript
private particleCount(): number {
  const base = Math.floor((this.canvas.width * this.canvas.height) / 18000);
  const modeMultiplier = MODE_DENSITY_MULTIPLIERS[this.mode] ?? 1.0;
  const count = Math.floor(base * modeMultiplier);
  return Math.min(count, 200);  // Hard cap at 200 to prevent memory issues
}
```

Update `setMode()`:

```typescript
setMode(mode: KairosMode): void {
  if (this.mode === mode) return; // no-op if unchanged
  this.mode = mode;
  this.init();  // re-init particles with new count
}
```

### Wire to KAIROS

`src/engines/kairos.ts` (or wherever mode-change events fire) — ensure the ParticleNetwork singleton's `setMode()` is called on every mode change:

```typescript
function onModeChange(newMode: KairosMode) {
  // ... existing code ...
  particleNetwork.setMode(newMode);
}
```

If KAIROS already uses an event bus, subscribe ParticleNetwork to mode-change events.

### Initial mode

ParticleNetwork must read the initial mode from KAIROS at construction time. If KAIROS state is in MNEMOS localStorage, read it once:

```typescript
constructor(canvas: HTMLCanvasElement) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d')!;
  this.mode = this.readInitialMode();
  // ... existing setup ...
}

private readInitialMode(): KairosMode {
  if (typeof localStorage === 'undefined') return 'aui';
  try {
    const stored = localStorage.getItem('acu-master-ops:mnemos:v1');
    if (!stored) return 'aui';
    const parsed = JSON.parse(stored);
    return parsed.dominantMode ?? 'aui';
  } catch {
    return 'aui';
  }
}
```

## Doctrinal red-lines

- Hard cap at 200 particles in ANY mode (memory limit · prevents Ambient × 3 from blowing up on high-res displays)
- `setMode()` is a no-op if mode unchanged (no needless reinit)
- Reduced-motion: particles still render but animation is paused (`cancelAnimationFrame`)
- ParticleNetwork respects `document.visibilitychange` (pause animation when tab hidden)
- MNEMOS key remains `acu-master-ops:mnemos:v1` (don't bump)
- No new external deps

## Tests

### Vitest

`src/engines/particle-network.test.ts`:

1. `particleCount()` for mode='aui' returns base count
2. `particleCount()` for mode='ambient' returns ~3× base (capped at 200)
3. `particleCount()` for mode='hud' returns ~0.3× base
4. `particleCount()` for mode='tuui' returns ~1.5× base
5. `particleCount()` for mode='gui' returns ~0.5× base
6. `particleCount()` for mode='dashboard' returns 1× base
7. `setMode('aui')` then `setMode('aui')` again does NOT call `init()` twice
8. `setMode('ambient')` calls `init()` and updates particle array length
9. Memory cap enforced: `canvas.width = canvas.height = 5000`, mode='ambient' → cap at 200
10. Reduced-motion preference: animation frame request is skipped

### Playwright (in `tests/living-interface.spec.ts`)

11. Switch to Ambient → particle count > 100 (canvas inspection via window.__acai diagnostic if exposed)
12. Switch to HUD → particle count < 50

## Acceptance criteria

- [ ] All 6 mode multipliers implemented
- [ ] Hard cap at 200 particles enforced
- [ ] Mode change triggers re-init only if mode differs
- [ ] ParticleNetwork reads initial mode from MNEMOS
- [ ] Reduced-motion respected
- [ ] visibilitychange pauses animation
- [ ] All 12 tests pass
- [ ] Bundle delta < +1 kB (this is a small change)
