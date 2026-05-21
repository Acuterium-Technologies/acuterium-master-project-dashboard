# 3d-i · Sub-spec 02 · Sentinel Dot

**Time:** 15 min · **Depends on:** 01 consent system

The screen indicator that lights up every time the camera is active. Mandatory · non-dismissible · visible above all UI chrome.

---

## Component

```tsx
// src/components/biometrics/SentinelDot.tsx

'use client';

import { useEffect, useState } from 'react';

export type SentinelChannel = 'face2feel' | 'voice2feel';
export type SentinelState = 'inactive' | 'active' | 'paused';

interface SentinelDotProps {
  channel: SentinelChannel;
  state: SentinelState;
}

const COLORS: Record<SentinelChannel, string> = {
  face2feel: '#ef4444',   // red · cam
  voice2feel: '#f59e0b',  // amber · mic (3d-ii)
};

const POSITIONS: Record<SentinelChannel, { top: string; right: string }> = {
  face2feel: { top: '16px', right: '16px' },
  voice2feel: { top: '16px', right: '48px' },  // sits left of cam dot
};

export function SentinelDot({ channel, state }: SentinelDotProps) {
  if (state === 'inactive') return null;

  const color = state === 'paused' ? '#f59e0b' : COLORS[channel];
  const pos = POSITIONS[channel];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${channel} sensor ${state}`}
      data-testid={`sentinel-${channel}`}
      data-state={state}
      style={{
        position: 'fixed',
        top: pos.top,
        right: pos.right,
        width: '16px',
        height: '16px',
        pointerEvents: 'none',
        zIndex: 99999,  // ABOVE EVERYTHING · LOCKED
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: '4px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: 0.4,
          animation: state === 'active' ? 'acu-sentinel-pulse 2s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
}
```

---

## CSS Animation

```css
/* src/styles/biometrics.css (append) */

@keyframes acu-sentinel-pulse {
  0%   { transform: scale(1);   opacity: 0.4; }
  50%  { transform: scale(1.4); opacity: 0.1; }
  100% { transform: scale(1);   opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  /* No animation · solid ring only · still visible */
  .acu-sentinel-pulse {
    animation: none !important;
  }
}
```

---

## Mounting

```tsx
// In app/(operations)/master-ops/page.tsx OR App() root

import { SentinelDot } from '@/components/biometrics/SentinelDot';
import { useFace2Feel } from '@/hooks/useFace2Feel';

export default function MasterOpsPage() {
  const face2feel = useFace2Feel();
  
  const sentinelState =
    !face2feel.isActive ? 'inactive' :
    document.visibilityState === 'hidden' ? 'paused' :
    'active';

  return (
    <>
      {/* existing page content */}
      <SentinelDot channel="face2feel" state={sentinelState} />
      {/* Voice2Feel dot wires in 3d-ii */}
    </>
  );
}
```

---

## Non-negotiables

1. **z-index 99999** — above modals, drawers, tooltips, everything
2. **`pointer-events: none`** — never blocks clicks
3. **`position: fixed`** — never scrolls away
4. **Renders only when state ≠ 'inactive'** — invisible when cam off
5. **Pulse animation respects `prefers-reduced-motion`** — solid ring fallback
6. **No bg/no border/no glass** — pure semantic indicator
7. **`aria-live="polite"`** — screen readers announce state changes

---

## Acceptance

1. Consent Off → dot DOES NOT render (no DOM element)
2. Consent Session/Persistent + cam active → red dot top-right · pulsing ring
3. Tab backgrounded → dot color changes to amber · pulse stops
4. Tab foregrounded → dot returns to red · pulse resumes within 500ms
5. Modal/drawer open → dot remains visible above modal (z-index test)
6. Reduced motion → pulse animation disabled · solid ring still visible
7. Screen reader: announces "face2feel sensor active" on state change
