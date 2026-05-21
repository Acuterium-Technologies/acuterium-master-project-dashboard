# 3d-i · Sub-spec 06 · Integration with PATHOS Engine + Dashboard

**Time:** 25 min · **Depends on:** 01-05 + Phase 1D PATHOS engine

How the Face2Feel signal flows into the existing PATHOS engine and renders in Dashboard mode.

---

## PATHOS Engine Extension Point

The existing `src/lib/engines/pathos.ts` (from Phase 1D) currently fuses NEXUS behavioral signals only. Extend it to accept Face2Feel deltas:

```typescript
// src/lib/engines/pathos.ts (MODIFIED)

import type { PathosState, PathosDelta } from '../biometrics/face2feel-types';
import { emaSmooth } from '../biometrics/ema';

export interface PathosInputs {
  nexus: PathosDelta | null;       // Phase 1D
  face2feel: PathosDelta | null;   // Phase 3d-i · NEW
  // voice2feel + touch2feel arrive in 3d-ii / 3d-iii
}

let previousState: PathosState | null = null;

export function computePATHOS(inputs: PathosInputs, confidence: { face: number }): PathosState {
  const sources: Array<{ delta: PathosDelta; weight: number }> = [];
  
  if (inputs.nexus) {
    sources.push({ delta: inputs.nexus, weight: 0.4 });  // NEXUS · behavioral
  }
  if (inputs.face2feel && confidence.face >= 0.6) {
    sources.push({ delta: inputs.face2feel, weight: 0.6 });  // Face · biometric
  }

  if (sources.length === 0) {
    return previousState ?? {
      stress: 0, focus: 0, curiosity: 0, fatigue: 0, satisfaction: 0,
      confidence: 0, source: 'fused', timestamp: Date.now(),
    };
  }

  const totalWeight = sources.reduce((s, x) => s + x.weight, 0);
  const fused: PathosDelta = {
    stress:       sources.reduce((s, x) => s + x.weight * x.delta.stress,       0) / totalWeight,
    focus:        sources.reduce((s, x) => s + x.weight * x.delta.focus,        0) / totalWeight,
    curiosity:    sources.reduce((s, x) => s + x.weight * x.delta.curiosity,    0) / totalWeight,
    fatigue:      sources.reduce((s, x) => s + x.weight * x.delta.fatigue,      0) / totalWeight,
    satisfaction: sources.reduce((s, x) => s + x.weight * x.delta.satisfaction, 0) / totalWeight,
  };

  const smoothed = emaSmooth(fused, previousState);
  
  const next: PathosState = {
    ...smoothed,
    confidence: inputs.face2feel ? confidence.face : 0.4,  // NEXUS-only confidence baseline
    source: sources.length > 1 ? 'fused' : (inputs.face2feel ? 'face' : 'nexus' as any),
    timestamp: Date.now(),
  };
  
  previousState = next;
  return next;
}
```

---

## App() Root Wiring

```tsx
// app/(operations)/master-ops/page.tsx (or App() root)

'use client';

import { useEffect } from 'react';
import { useFace2Feel } from '@/hooks/useFace2Feel';
import { useNEXUS } from '@/hooks/useNEXUS';
import { computePATHOS } from '@/lib/engines/pathos';
import { MNEMOS } from '@/lib/engines/mnemos';
import { SentinelDot } from '@/components/biometrics/SentinelDot';

export default function MasterOpsPage() {
  const face2feel = useFace2Feel();
  const nexus = useNEXUS();

  // Fuse signals every time face2feel emits a new delta
  useEffect(() => {
    if (!face2feel.lastDelta && !nexus.lastDelta) return;
    
    const fused = computePATHOS(
      { nexus: nexus.lastDelta, face2feel: face2feel.lastDelta },
      { face: face2feel.lastConfidence }
    );
    
    // Persist fused state · 5-axis only · NEVER raw biometric
    MNEMOS.save('pathos:current', fused);
    
    // Append to rolling history (last 300 samples · ~1 min @ 5fps)
    MNEMOS.appendCircular('pathos:history', fused, 300);
  }, [face2feel.lastDelta, nexus.lastDelta]);

  const sentinelState =
    !face2feel.isActive ? 'inactive' :
    typeof document !== 'undefined' && document.visibilityState === 'hidden' ? 'paused' :
    'active';

  return (
    <>
      {/* existing dashboard content */}
      <SentinelDot channel="face2feel" state={sentinelState} />
    </>
  );
}
```

---

## PathosBars Dashboard Component (already exists from Phase 1D)

Verify the existing `<PathosBars />` reads from `MNEMOS.load('pathos:current')` — if so, NO CHANGES needed. The Face2Feel signal automatically flows through.

If `<PathosBars />` reads from a different source, add a subscription:

```tsx
// src/components/dashboard/PathosBars.tsx (verify · likely no change needed)

import { useMNEMOSValue } from '@/hooks/useMNEMOS';

export function PathosBars() {
  const pathos = useMNEMOSValue('pathos:current');
  if (!pathos) return null;
  
  const axes = [
    { key: 'stress',       label: 'Stress' },
    { key: 'focus',        label: 'Focus' },
    { key: 'curiosity',    label: 'Curiosity' },
    { key: 'fatigue',      label: 'Fatigue' },
    { key: 'satisfaction', label: 'Satisfaction' },
  ] as const;
  
  return (
    <div className="acu-pathos-bars" data-testid="pathos-bars">
      {axes.map(({ key, label }) => (
        <div key={key} className="acu-pathos-axis">
          <span className="acu-pathos-label">{label}</span>
          <div className="acu-pathos-track">
            <div
              className="acu-pathos-fill"
              style={{
                width: `${50 + 50 * pathos[key]}%`,  // -1 → 0%, 0 → 50%, +1 → 100%
                background: `var(--acu-pathos-${key})`,
              }}
            />
          </div>
        </div>
      ))}
      <div className="acu-pathos-confidence" data-testid="pathos-confidence">
        Confidence: {Math.round(pathos.confidence * 100)}%
      </div>
    </div>
  );
}
```

---

## Conformance Matrix Probe

```typescript
// src/lib/conformance/matrix.ts (MODIFIED · add probe)

export const CONFORMANCE_PROBES = [
  // ... existing probes
  {
    id: 'face2feel-engine',
    label: 'Face2Feel Engine',
    weight: 5,
    probe: () => typeof (globalThis as any).window?.__acai?.face2feel === 'object',
  },
  {
    id: 'face2feel-consent-route',
    label: 'Face2Feel Consent Route',
    weight: 2,
    probe: async () => {
      const res = await fetch('/master-ops/settings/biometrics', { method: 'HEAD' });
      return res.ok;
    },
  },
];
```

After 3d-i, ACAI V2 conformance should rise from ~85% to ~88%.

---

## BiometricStatusBadge (Dashboard right rail)

```tsx
// src/components/biometrics/BiometricStatusBadge.tsx

'use client';

import { useFace2Feel } from '@/hooks/useFace2Feel';

export function BiometricStatusBadge() {
  const { tier, isActive, lastConfidence } = useFace2Feel();
  
  return (
    <div className="acu-status-badge" data-testid="biometric-status">
      <div className="acu-status-row">
        <span className="acu-status-icon" aria-hidden>🎥</span>
        <span className="acu-status-label">Face2Feel</span>
        <span className={`acu-status-dot acu-status-${tier === 'off' ? 'off' : isActive ? 'on' : 'pending'}`} />
      </div>
      {isActive && (
        <div className="acu-status-meta">
          Confidence: {Math.round(lastConfidence * 100)}%
        </div>
      )}
      {/* Voice2Feel row arrives in 3d-ii */}
      {/* Touch2Feel row arrives in 3d-iii */}
    </div>
  );
}
```

Mount in the Dashboard mode's 300px right rail (above AuditLog tail).

---

## GDPR Art. 9 Disclosure Page

```tsx
// app/legal/biometric/page.tsx

export const metadata = {
  title: 'Biometric Data Disclosure · Acuterium',
};

export default function BiometricDisclosurePage() {
  return (
    <main className="acu-legal-page">
      <h1>Biometric Data Processing Disclosure</h1>
      <p className="acu-lede">
        Under EU GDPR Article 9 and Oman Personal Data Protection Law,
        biometric data is a special category requiring explicit consent
        and transparent disclosure of processing.
      </p>

      <h2>What we process</h2>
      <ul>
        <li>Camera frames at 5 fps · 320×240 resolution · grayscale</li>
        <li>Facial landmarks (468 points · MediaPipe Face Mesh)</li>
        <li>7-emotion probability vector (neutral / happy / sad / angry / fearful / disgusted / surprised)</li>
      </ul>

      <h2>What we retain</h2>
      <ul>
        <li>A 5-axis emotion vector (Stress · Focus · Curiosity · Fatigue · Satisfaction)</li>
        <li>Stored ONLY in your browser's localStorage</li>
        <li>NEVER transmitted to any server</li>
      </ul>

      <h2>What we DELETE immediately</h2>
      <ul>
        <li>Every camera frame (within 16 ms of capture)</li>
        <li>Every facial landmark array (within same animation frame)</li>
        <li>Every raw emotion vector (after PATHOS mapping)</li>
      </ul>

      <h2>Where processing happens</h2>
      <p>
        100% in your browser. All ML models are downloaded once from
        this site and cached locally. No cloud inference. No third-party data
        processor. The Acuterium platform never receives your biometric data.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>Revoke consent any time from <a href="/master-ops/settings/biometrics">Settings · Biometrics</a></li>
        <li>Data Subject Access Request (DSAR): arriving in Phase 3d-v</li>
        <li>Right to erasure: clears localStorage entirely</li>
      </ul>

      <h2>Legal basis</h2>
      <p>
        Article 9(2)(a) GDPR — explicit consent. Default state is OFF. Each
        consent tier (Session-only · Persistent) requires affirmative action.
      </p>

      <h2>Open-source attribution</h2>
      <ul>
        <li>MediaPipe Tasks Vision · Apache 2.0</li>
        <li>face-api.js · MIT</li>
        <li>TensorFlow.js · Apache 2.0</li>
      </ul>
      
      <p>
        Full licenses: <a href="/legal/open-source-licenses">/legal/open-source-licenses</a>
      </p>
    </main>
  );
}
```

Arabic version: `app/ar/legal/biometric/page.tsx` (translation provided by RUZN.AI sister project · use Noto Kufi Arabic).

---

## Acceptance

1. `computePATHOS` accepts both nexus and face2feel inputs · returns weighted fused state
2. With consent off · only NEXUS source contributes · `state.source === 'nexus'`
3. With consent on · face2feel weight 0.6 dominates · `state.source === 'fused'`
4. `MNEMOS.save('pathos:current')` writes 5-axis only · NEVER raw emotion vector
5. PathosBars updates in Dashboard mode within 1s of face detection
6. BiometricStatusBadge shows correct dot color per state
7. `/legal/biometric` route renders disclosure page · WCAG AA contrast
8. Conformance matrix probe `face2feel-engine` returns true when worker active
9. Conformance score rises from ~85% to ~88% (verified by `/api/dashboard/conformance`)
10. Arabic page renders with RTL layout · Noto Kufi Arabic font
