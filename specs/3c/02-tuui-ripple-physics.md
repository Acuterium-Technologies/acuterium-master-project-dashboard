# Spec 3c.02 · TUUI Ripple Physics

**Sub-phase:** 3c
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 30 min
**Closes:** ACAI V2 conformance · TUUI Tactile mode 30% → 90%

---

## Why

ACAI V2 canon defines TUUI (Tactile) as the touch-input mode with:
- No cursor (cursor: none)
- 48 × 48 px minimum touch targets
- Ripple physics on every interaction
- Auto-activation when NEXUS detects no mousemove for 10 s after page load

Current build has the mode switch (Alt+T binds to TUUI mode and the body class applies) but **no actual ripple physics, no 48px enforcement, no cursor:none, no auto-activation**. Phase 3c.02 lands the missing behavior.

## Out of scope

- Multi-touch gesture recognition (pinch-zoom, two-finger swipe) → Phase 3d-iii Touch2Feel scope
- Haptic vibration API integration → Phase 3d-iii
- Per-element ripple color theming → just use cyan-prime everywhere this phase

## TUUI activation logic

```typescript
// src/engines/tuui-detector.ts

let lastMouseMove = Date.now();
let isPointerCoarse = false;

if (typeof window !== 'undefined') {
  document.addEventListener('mousemove', () => { lastMouseMove = Date.now(); });
  isPointerCoarse = window.matchMedia('(pointer: coarse)').matches;

  // After 10s of no mousemove AND pointer is coarse → auto-activate TUUI
  setTimeout(() => {
    if (Date.now() - lastMouseMove >= 9_000 && isPointerCoarse) {
      // Trigger KAIROS mode switch to TUUI
      window.dispatchEvent(new CustomEvent('kairos:auto-switch', { detail: { mode: 'tuui', source: 'nexus' } }));
    }
  }, 10_000);
}
```

KAIROS engine should already be listening for the `kairos:auto-switch` event from its existing auto-switch handler. If not, wire it in `src/engines/kairos.ts` to handle source='nexus' the same way it handles `source='kairos'`.

## Ripple physics

### CSS (add to master-ops.css)

```css
/* ─── TUUI Tactile mode ─── */

body.mode-tuui {
  cursor: none;
}

body.mode-tuui .tuui-target,
body.mode-tuui button,
body.mode-tuui a,
body.mode-tuui [role="button"] {
  position: relative;
  overflow: hidden;
  min-height: 48px;
  min-width: 48px;
}

.tuui-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 229, 212, 0.30);
  transform: scale(0);
  pointer-events: none;
  animation: tuuiRipple 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes tuuiRipple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tuui-ripple {
    animation: none;
    opacity: 0;
  }
}
```

### Ripple injection script

```typescript
// src/engines/tuui-ripple.ts

let attached = false;

export function attachTUUIRipples() {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('click', handleClickInTUUI, { passive: true });
}

function handleTouchStart(e: TouchEvent) {
  if (!document.body.classList.contains('mode-tuui')) return;
  const touch = e.touches[0];
  if (!touch) return;
  const target = (e.target as Element)?.closest<HTMLElement>('.tuui-target, button, a, [role="button"]');
  if (!target) return;
  spawnRipple(target, touch.clientX, touch.clientY);
}

function handleClickInTUUI(e: MouseEvent) {
  // Also fire on desktop click when in TUUI mode (e.g. for testing)
  if (!document.body.classList.contains('mode-tuui')) return;
  const target = (e.target as Element)?.closest<HTMLElement>('.tuui-target, button, a, [role="button"]');
  if (!target) return;
  spawnRipple(target, e.clientX, e.clientY);
}

function spawnRipple(target: HTMLElement, x: number, y: number) {
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'tuui-ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x - rect.left - size / 2}px`;
  ripple.style.top = `${y - rect.top - size / 2}px`;
  target.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}
```

### Wire into app boot

`app/master-ops/page.tsx`:

```typescript
import { attachTUUIRipples } from '@/src/engines/tuui-ripple';

useEffect(() => {
  attachTUUIRipples();
}, []);
```

## Doctrinal red-lines

- TUUI mode auto-activates ONLY when pointer is coarse AND idle >10s (no false positives on desktop)
- 48 × 48 px minimum enforced via CSS only (no JS layout writes)
- Ripple uses CSS animation with `requestAnimationFrame`-friendly properties (transform, opacity) — no layout thrash
- Ripple element is automatically cleaned up on `animationend` (no DOM leak)
- `cursor: none` is mode-scoped (only body.mode-tuui)
- Reduced-motion preference disables the ripple animation entirely
- Touch event listener is `{ passive: true }` (no scroll-blocking)

## Tests

### Vitest

`src/engines/tuui-ripple.test.tsx`:

1. `attachTUUIRipples()` is idempotent (calling twice doesn't double-attach)
2. Touch event outside `body.mode-tuui` → no ripple created
3. Touch event inside `body.mode-tuui` on `.tuui-target` → ripple element appended
4. Ripple element removed after `animationend` fires
5. Ripple element receives correct `width`/`height` based on target size
6. Touch event coordinates correctly mapped relative to target

`src/engines/tuui-detector.test.ts`:

7. `isPointerCoarse` correctly mocks `(pointer: coarse)`
8. No mousemove for 10s + coarse pointer → kairos:auto-switch event dispatched
9. Mousemove within 10s → no auto-switch
10. Coarse pointer false → no auto-switch even after 10s

### Playwright (in `tests/living-interface.spec.ts`)

11. Mobile viewport (iPhone 14 emulation) → 48 × 48 min target verified on a button
12. Click `[data-qa="hero-lockup"]` in TUUI mode → ripple element appears briefly

## Acceptance criteria

- [ ] `body.mode-tuui` triggers `cursor: none` globally
- [ ] All interactive elements ≥ 48 × 48 px in TUUI mode
- [ ] Ripple appears on touch in TUUI mode
- [ ] Ripple cleaned up after 600 ms animation
- [ ] No ripple appears in non-TUUI modes
- [ ] NEXUS auto-activates TUUI after 10s idle + coarse pointer
- [ ] Reduced-motion disables ripples
- [ ] All 12 tests pass
- [ ] Bundle delta < +3 kB
- [ ] Preflight 7.21 (reduced-motion) verified
