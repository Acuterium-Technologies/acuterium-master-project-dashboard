# 3d-i · Sub-spec 01 · Three-Tier Consent System

**Time:** 30 min · **Depends on:** Phase 3c (App() root + EditDrawer pattern)

---

## State Machine

```
       (default)
         OFF ─────────┬─── user clicks "Enable for this session" ───→ SESSION
          ↑           │
          │           ├─── user clicks "Always enable" ──────────────→ PERSISTENT
          │           │
   user clicks         user clicks
   "Revoke" /          "Always enable"
   tab close                          
   (session)                          
          │                           
          │                           
       SESSION ────── user clicks "Always enable" ─────────────────→ PERSISTENT
          ↑                                                            │
          │                                                            │
          │                                                            │
          └── tab close (auto-revoke)                                  │
                                                                       │
       PERSISTENT ───── user clicks "Revoke" ────────────────────→ OFF
                       (clears localStorage)
```

**Invariants:**

1. No automatic upgrades (Session → Persistent requires explicit user click)
2. Tab close auto-revokes Session (no localStorage write)
3. Revoke from Persistent clears localStorage AND stops MediaStream
4. Each channel (face, voice, touch) has independent state (3d-i implements Face only)

---

## TypeScript Contract

```typescript
// src/lib/biometrics/consent-state.ts

export type ConsentTier = 'off' | 'session' | 'persistent';

export type Channel = 'face2feel' | 'voice2feel' | 'touch2feel';

export interface ConsentRecord {
  channel: Channel;
  tier: ConsentTier;
  grantedAt: string;      // ISO 8601
  grantedVersion: 'v1';   // for future migration
}

const STORAGE_KEY = 'acu-master-ops:consent:v1';

export function loadConsent(channel: Channel): ConsentTier {
  if (typeof window === 'undefined') return 'off';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'off';
    const parsed = JSON.parse(raw) as Record<Channel, ConsentRecord>;
    return parsed[channel]?.tier === 'persistent' ? 'persistent' : 'off';
    // Note: 'session' is held in sessionStorage instead (see below)
  } catch {
    return 'off';
  }
}

export function saveConsent(channel: Channel, tier: ConsentTier): void {
  if (typeof window === 'undefined') return;
  const record: ConsentRecord = {
    channel,
    tier,
    grantedAt: new Date().toISOString(),
    grantedVersion: 'v1',
  };
  if (tier === 'persistent') {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    existing[channel] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } else if (tier === 'session') {
    sessionStorage.setItem(`${STORAGE_KEY}:${channel}`, JSON.stringify(record));
  } else {
    // 'off' clears both
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    delete existing[channel];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    sessionStorage.removeItem(`${STORAGE_KEY}:${channel}`);
  }
}

export function getEffectiveTier(channel: Channel): ConsentTier {
  const persistent = loadConsent(channel);
  if (persistent === 'persistent') return 'persistent';
  const sessionRaw = sessionStorage.getItem(`${STORAGE_KEY}:${channel}`);
  if (sessionRaw) return 'session';
  return 'off';
}
```

---

## Hook

```typescript
// src/hooks/useConsent.ts

import { useState, useEffect, useCallback } from 'react';
import { Channel, ConsentTier, getEffectiveTier, saveConsent } from '@/lib/biometrics/consent-state';

export function useConsent(channel: Channel) {
  const [tier, setTier] = useState<ConsentTier>('off');

  useEffect(() => {
    setTier(getEffectiveTier(channel));
  }, [channel]);

  const grant = useCallback((newTier: ConsentTier) => {
    saveConsent(channel, newTier);
    setTier(newTier);
  }, [channel]);

  const revoke = useCallback(() => {
    saveConsent(channel, 'off');
    setTier('off');
  }, [channel]);

  return { tier, grant, revoke };
}
```

---

## UI Component

```tsx
// src/components/biometrics/ConsentPanel.tsx

'use client';

import { useConsent } from '@/hooks/useConsent';

export function ConsentPanel() {
  const { tier, grant, revoke } = useConsent('face2feel');

  return (
    <section className="acu-glass acu-panel" aria-labelledby="face2feel-consent-heading">
      <h2 id="face2feel-consent-heading" className="acu-h2">
        Face2Feel · Emotion-Aware Interface
      </h2>
      <p className="acu-body">
        Face2Feel uses your camera to read facial expression cues (focus, fatigue, stress)
        in 5 fps · 320×240 grayscale. All inference runs in your browser. No video, no
        landmarks, no images ever leave your device. Only a 5-number emotion vector is
        retained, and only locally.
      </p>
      <p className="acu-body">
        Read the full <a href="/legal/biometric">biometric data disclosure</a>.
      </p>

      <div className="acu-consent-grid" role="radiogroup" aria-label="Consent level">
        <button
          role="radio"
          aria-checked={tier === 'off'}
          onClick={revoke}
          className={`acu-consent-card ${tier === 'off' ? 'acu-consent-active' : ''}`}
        >
          <strong>Off</strong>
          <span>Camera never activated. Default.</span>
        </button>

        <button
          role="radio"
          aria-checked={tier === 'session'}
          onClick={() => grant('session')}
          className={`acu-consent-card ${tier === 'session' ? 'acu-consent-active' : ''}`}
        >
          <strong>This session only</strong>
          <span>Auto-revokes when you close this tab.</span>
        </button>

        <button
          role="radio"
          aria-checked={tier === 'persistent'}
          onClick={() => grant('persistent')}
          className={`acu-consent-card ${tier === 'persistent' ? 'acu-consent-active' : ''}`}
        >
          <strong>Always enable</strong>
          <span>Persists across tabs. Revocable anytime.</span>
        </button>
      </div>

      {tier !== 'off' && (
        <p className="acu-body acu-muted" data-testid="consent-active-banner">
          Status: <strong>{tier === 'session' ? 'Session-only' : 'Persistent'}</strong>
          {' · '}
          <button onClick={revoke} className="acu-link-button">Revoke now</button>
        </p>
      )}
    </section>
  );
}
```

---

## Route Mount

```tsx
// app/(operations)/master-ops/settings/biometrics/page.tsx

import { ConsentPanel } from '@/components/biometrics/ConsentPanel';

export const metadata = {
  title: 'Biometrics · Master Operations',
};

export default function BiometricsSettingsPage() {
  return (
    <main className="acu-page-wrap">
      <h1 className="acu-h1">Biometric Sensing</h1>
      <p className="acu-lede">
        Multi-modal emotional intelligence for the consciousness-aware interface.
        All data is processed at the edge and never transmitted.
      </p>
      <ConsentPanel />
      {/* Voice2Feel ConsentPanel arrives in 3d-ii */}
      {/* Touch2Feel ConsentPanel arrives in 3d-iii */}
    </main>
  );
}
```

---

## CSS Tokens (additive · do not modify existing)

```css
/* src/styles/biometrics.css */

.acu-consent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.acu-consent-card {
  background: rgba(255, 255, 255, 0.45);  /* glass 45% · LOCKED */
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: all 200ms ease-out;
  min-height: 48px;  /* TUUI 48px LOCKED */
}

.acu-consent-card:hover {
  background: rgba(255, 255, 255, 0.52);
}

.acu-consent-active {
  border-color: var(--acu-cyan-prime, #00d4ff);
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .acu-consent-card { transition: none; }
}
```

---

## Acceptance

1. `/master-ops/settings/biometrics` renders 3 consent cards
2. Default tier: `off` · no camera permission triggered
3. Clicking "This session only" → calls `getEffectiveTier()` returns `'session'` · sessionStorage entry created
4. Clicking "Always enable" → localStorage entry created
5. Clicking "Revoke now" → both storage entries cleared · `tier` returns to `off`
6. Tab close (Session tier) → next page load returns `off`
7. Tab close (Persistent tier) → next page load returns `persistent`
8. Three glass cards conform to 45-55% transparency rule
9. Keyboard accessible: Tab + Enter selects each card
10. Screen reader: `role="radiogroup"` + `aria-checked` work correctly
