# Spec 3c.01 · CHRONOS GCC Prayer-Time Gradients

**Sub-phase:** 3c
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 45 min
**Closes:** ACAI V2 conformance · CHRONOS GCC adaptation 0% → 100%

---

## Why

ACAI V2 canon defines CHRONOS as the temporal-awareness layer that adapts background gradients to the user's local time. For GCC locales (Oman, Saudi Arabia, UAE, Qatar, Bahrain), this means 6 Islamic prayer-time periods. For other locales, fall back to 6 standard time-of-day mappings.

This is a notable cultural omission to fix for an Oman-based sovereign system. The dashboard currently uses a static gradient regardless of time. After 3c.01, the dashboard breathes with the day.

## Out of scope

- Real prayer-time API integration (e.g., Aladhan API) — Phase 4 candidate · 3c uses fixed hour-boundary fallback
- Hijri calendar awareness — Phase 5 candidate
- City-specific prayer time (we use locale-wide GCC averages here)

## Locale detection

```typescript
function isGCCLocale(): boolean {
  const lang = navigator.language || (navigator as { languages?: string[] }).languages?.[0] || '';
  return /^ar-(OM|SA|AE|QA|BH)$/i.test(lang);
}
```

If detection fails or `lang` is undefined, default to **standard time-of-day mapping** (not GCC) — graceful fallback.

## The 6 CHRONOS states

### GCC mapping (hour-boundary fallback · no prayer-time API)

| Hour range (local) | Period | Arabic | English | Background gradient |
|---|---|---|---|---|
| 04:00 – 05:59 | Fajr | الفجر | Pre-Dawn | `linear-gradient(135deg, #020408 0%, #040816 50%, #06102A 100%)` |
| 06:00 – 11:59 | Duha | الضحى | Mid-Morning | `linear-gradient(135deg, #C4DFF0 0%, #A8CCDE 50%, #90B8CC 100%)` |
| 12:00 – 13:59 | Dhuhr | الظهر | Noon | `linear-gradient(135deg, #B8D8EA 0%, #A4CAE0 45%, #8FB5CC 100%)` |
| 14:00 – 16:59 | Asr | العصر | Afternoon | `linear-gradient(135deg, #B0B8DC 0%, #96A4CC 40%, #7888BC 100%)` |
| 17:00 – 19:59 | Maghrib | المغرب | Sunset | `linear-gradient(135deg, #7A5090 0%, #4A2870 40%, #2A1050 100%)` |
| 20:00 – 03:59 | Isha | العشاء | Night | `linear-gradient(135deg, #080D2E 0%, #0D1140 40%, #1A0D48 100%)` |

### Non-GCC mapping (used by everyone else)

| Hour range (local) | Period | Label | Gradient |
|---|---|---|---|
| 00:00 – 05:59 | Pre-Dawn | Pre-Dawn | `linear-gradient(135deg, #020510 0%, #050820 100%)` |
| 06:00 – 11:59 | Morning | Morning | `linear-gradient(135deg, #B8D8EA 0%, #A4CAE0 100%)` |
| 12:00 – 14:59 | Noon | Noon | `linear-gradient(135deg, #B0C8E0 0%, #9AB8D0 100%)` |
| 15:00 – 16:59 | Afternoon | Afternoon | `linear-gradient(135deg, #A8B8D8 0%, #8898C8 100%)` |
| 17:00 – 19:59 | Sunset | Sunset | `linear-gradient(135deg, #6A4A8A 0%, #3A2060 100%)` |
| 20:00 – 23:59 | Night | Night | `linear-gradient(135deg, #030509 0%, #05071A 100%)` |

## Files to create

### `src/engines/chronos.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';

export type ChronosPeriod =
  | 'fajr' | 'duha' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'   // GCC
  | 'pre-dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'night';  // Standard

export interface ChronosState {
  period: ChronosPeriod;
  gradient: string;
  labelEn: string;
  labelAr: string;
  isGCC: boolean;
  hour: number;
}

const GCC_PERIODS: Array<{ from: number; to: number; period: ChronosPeriod; gradient: string; labelEn: string; labelAr: string }> = [
  { from: 4,  to: 6,  period: 'fajr',    labelEn: 'Fajr',    labelAr: 'الفجر',   gradient: 'linear-gradient(135deg, #020408 0%, #040816 50%, #06102A 100%)' },
  { from: 6,  to: 12, period: 'duha',    labelEn: 'Duha',    labelAr: 'الضحى',   gradient: 'linear-gradient(135deg, #C4DFF0 0%, #A8CCDE 50%, #90B8CC 100%)' },
  { from: 12, to: 14, period: 'dhuhr',   labelEn: 'Dhuhr',   labelAr: 'الظهر',   gradient: 'linear-gradient(135deg, #B8D8EA 0%, #A4CAE0 45%, #8FB5CC 100%)' },
  { from: 14, to: 17, period: 'asr',     labelEn: 'Asr',     labelAr: 'العصر',   gradient: 'linear-gradient(135deg, #B0B8DC 0%, #96A4CC 40%, #7888BC 100%)' },
  { from: 17, to: 20, period: 'maghrib', labelEn: 'Maghrib', labelAr: 'المغرب',  gradient: 'linear-gradient(135deg, #7A5090 0%, #4A2870 40%, #2A1050 100%)' },
];

const STD_PERIODS: Array<{ from: number; to: number; period: ChronosPeriod; gradient: string; labelEn: string; labelAr: string }> = [
  { from: 0,  to: 6,  period: 'pre-dawn',  labelEn: 'Pre-Dawn',  labelAr: 'الفجر',   gradient: 'linear-gradient(135deg, #020510 0%, #050820 100%)' },
  { from: 6,  to: 12, period: 'morning',   labelEn: 'Morning',   labelAr: 'الضحى',   gradient: 'linear-gradient(135deg, #B8D8EA 0%, #A4CAE0 100%)' },
  { from: 12, to: 15, period: 'noon',      labelEn: 'Noon',      labelAr: 'الظهر',   gradient: 'linear-gradient(135deg, #B0C8E0 0%, #9AB8D0 100%)' },
  { from: 15, to: 17, period: 'afternoon', labelEn: 'Afternoon', labelAr: 'العصر',   gradient: 'linear-gradient(135deg, #A8B8D8 0%, #8898C8 100%)' },
  { from: 17, to: 20, period: 'sunset',    labelEn: 'Sunset',    labelAr: 'المغرب',  gradient: 'linear-gradient(135deg, #6A4A8A 0%, #3A2060 100%)' },
];

const ISHA_GRADIENT = 'linear-gradient(135deg, #080D2E 0%, #0D1140 40%, #1A0D48 100%)';
const STD_NIGHT_GRADIENT = 'linear-gradient(135deg, #030509 0%, #05071A 100%)';

export function isGCCLocale(): boolean {
  if (typeof navigator === 'undefined') return false;
  const lang = navigator.language || (navigator as { languages?: string[] }).languages?.[0] || '';
  return /^ar-(OM|SA|AE|QA|BH)$/i.test(lang);
}

export function getChronosState(hour: number = new Date().getHours(), gcc?: boolean): ChronosState {
  const isGCC = gcc ?? isGCCLocale();
  if (isGCC) {
    for (const p of GCC_PERIODS) {
      if (hour >= p.from && hour < p.to) {
        return { period: p.period, gradient: p.gradient, labelEn: p.labelEn, labelAr: p.labelAr, isGCC: true, hour };
      }
    }
    return { period: 'isha', gradient: ISHA_GRADIENT, labelEn: 'Isha', labelAr: 'العشاء', isGCC: true, hour };
  } else {
    for (const p of STD_PERIODS) {
      if (hour >= p.from && hour < p.to) {
        return { period: p.period, gradient: p.gradient, labelEn: p.labelEn, labelAr: p.labelAr, isGCC: false, hour };
      }
    }
    return { period: 'night', gradient: STD_NIGHT_GRADIENT, labelEn: 'Night', labelAr: 'الليل', isGCC: false, hour };
  }
}

export function applyChronos(): ChronosState {
  const state = getChronosState();
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--chronos-gradient', state.gradient);
    document.documentElement.dataset.chronosPeriod = state.period;
    document.documentElement.dataset.chronosGcc = String(state.isGCC);
  }
  return state;
}

export function useChronos(): ChronosState {
  const [state, setState] = useState<ChronosState>(() => getChronosState());

  useEffect(() => {
    setState(applyChronos());
    const interval = setInterval(() => setState(applyChronos()), 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  return state;
}
```

### `src/components/dashboard/ChronosLabel.tsx`

A small component for the consciousness bar / top strip:

```typescript
'use client';

import { useChronos } from '@/src/engines/chronos';

export function ChronosLabel({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const state = useChronos();
  const lang = state.isGCC ? 'ar' : 'en';
  const label = state.isGCC ? state.labelAr : state.labelEn;

  if (variant === 'compact') {
    return (
      <span className="acu-chronos-label" data-qa="chronos-label" lang={lang} dir={state.isGCC ? 'rtl' : 'ltr'}>
        {label}
      </span>
    );
  }

  return (
    <div className="acu-chronos-label acu-chronos-label--full" data-qa="chronos-label-full">
      <span className="acu-chronos-label__en">{state.labelEn}</span>
      <span className="acu-chronos-label__ar" lang="ar" dir="rtl">{state.labelAr}</span>
      <span className="acu-chronos-label__hour">{state.hour.toString().padStart(2, '0')}:00</span>
    </div>
  );
}
```

### CSS additions to `src/styles/master-ops.css`

Add to the `:root` block:

```css
  --chronos-gradient: linear-gradient(135deg, var(--bg-void) 0%, var(--bg-deep) 100%); /* fallback */
```

Update `body` background (find existing rule and replace):

```css
body {
  background: var(--chronos-gradient), radial-gradient(ellipse at 20% 50%, rgba(0, 60, 80, 0.4) 0%, transparent 60%);
  background-attachment: fixed;
  transition: background 1200ms cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
}
```

ChronosLabel styles (new block in `master-ops.css`):

```css
.acu-chronos-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: rgba(0, 229, 212, 0.06);
  border: 1px solid var(--border-cyan-mid);
  border-radius: var(--radius-pill);
}

.acu-chronos-label[lang="ar"] {
  font-family: var(--font-arabic, var(--font-ui));
  font-size: 12px;
  letter-spacing: 0;
}

.acu-chronos-label--full {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
```

## Files to modify

### `src/components/dashboard/TopStrip.tsx`

Add `<ChronosLabel variant="compact" />` next to the conformance gauge.

### `app/master-ops/page.tsx`

Call `applyChronos()` on mount so the gradient applies before first paint even outside the BIGrid path.

## Doctrinal red-lines

- Locale detection MUST use `navigator.language` (no IP geolocation · privacy by default)
- Arabic labels MUST be displayed with `dir="rtl"` for proper rendering
- Background transitions are 1200 ms (slow · breathy · not jarring) — matches ACAI V2 living organism feel
- Update interval is 10 minutes (not seconds · no animation thrash)
- Reduced-motion: gradient still changes (it's not an animation, it's a state change) but transition is set to `transition: none` when `prefers-reduced-motion: reduce`
- Glass transparency unchanged (gradient is on body, glass cards still 45-55%)

## Tests

### Vitest

`src/engines/chronos.test.ts`:

1. `getChronosState(5, true)` → period='fajr', isGCC=true
2. `getChronosState(9, true)` → period='duha'
3. `getChronosState(13, true)` → period='dhuhr'
4. `getChronosState(15, true)` → period='asr'
5. `getChronosState(18, true)` → period='maghrib'
6. `getChronosState(21, true)` → period='isha'
7. `getChronosState(3, true)` → period='isha' (wraps past midnight)
8. `getChronosState(9, false)` → period='morning' (non-GCC mapping)
9. `getChronosState(18, false)` → period='sunset'
10. `isGCCLocale()` returns true for mock `ar-OM`
11. `isGCCLocale()` returns false for mock `en-US`
12. `applyChronos()` sets `--chronos-gradient` CSS variable
13. `applyChronos()` sets `dataset.chronosPeriod`
14. `useChronos()` returns initial state immediately (no useEffect wait)

### Playwright (in `tests/living-interface.spec.ts`)

15. Mock clock at 05:00 → gradient = Fajr palette (computed style check)
16. Mock clock at 09:00 → gradient = Duha palette
17. Mock clock at 18:00 → gradient = Maghrib palette
18. Set locale to `ar-OM` → Arabic label الفجر renders
19. Set locale to `en-US` → English label "Pre-Dawn" renders

## Acceptance criteria

- [ ] `applyChronos()` runs on every mount
- [ ] CSS var `--chronos-gradient` is set
- [ ] Body background uses `var(--chronos-gradient)`
- [ ] All 6 GCC periods + 6 standard periods defined
- [ ] All 19 Vitest + Playwright tests pass
- [ ] Arabic labels render with proper RTL direction
- [ ] 10-minute re-evaluation interval works
- [ ] Background transition is 1200 ms (smooth · breathy)
- [ ] Reduced-motion respected (transition: none if prefers-reduced-motion)
- [ ] Bundle delta < +5 kB (CHRONOS is small)
- [ ] Preflight rule 7.20 verified
