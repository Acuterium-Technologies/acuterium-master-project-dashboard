/**
 * CHRONOS engine · unit tests · Phase 3c.01.
 *
 * Pure-function coverage of getChronosState + isGCCLocale boundary cases.
 * The DOM side-effects in applyChronos / useChronos are exercised by the
 * Playwright living-interface.spec.ts mock-clock cases — keeping vitest in
 * node env (no jsdom).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, it, expect, afterEach, beforeAll } from 'vitest';

import { getChronosState, isGCCLocale, CHRONOS_REEVAL_MS } from './chronos';

/**
 * Node 21+ ships a read-only `navigator` global getter, so direct
 * `globalThis.navigator = …` assignment throws. We use
 * Object.defineProperty to override per-test and restore in afterEach.
 */
type NavigatorMock = { language?: string; languages?: readonly string[] };

const ORIGINAL_DESCRIPTOR = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function setNavigatorLanguage(lang: string | undefined): void {
  const value: NavigatorMock | undefined =
    lang === undefined ? undefined : { language: lang, languages: [lang] };
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (ORIGINAL_DESCRIPTOR) {
    Object.defineProperty(globalThis, 'navigator', ORIGINAL_DESCRIPTOR);
  } else {
    // Best-effort restore: delete the override (still configurable from setter).
    try {
      delete (globalThis as Record<string, unknown>).navigator;
    } catch {
      /* ignore */
    }
  }
});

beforeAll(() => {
  expect(CHRONOS_REEVAL_MS).toBe(10 * 60 * 1000);
});

describe('getChronosState · GCC mapping', () => {
  it('Fajr period at 04:00 → 05:59', () => {
    expect(getChronosState(4, true).period).toBe('fajr');
    expect(getChronosState(5, true).period).toBe('fajr');
  });

  it('Duha period at 06:00 → 11:59', () => {
    expect(getChronosState(6, true).period).toBe('duha');
    expect(getChronosState(9, true).period).toBe('duha');
    expect(getChronosState(11, true).period).toBe('duha');
  });

  it('Dhuhr period at 12:00 → 13:59', () => {
    expect(getChronosState(12, true).period).toBe('dhuhr');
    expect(getChronosState(13, true).period).toBe('dhuhr');
  });

  it('Asr period at 14:00 → 16:59', () => {
    expect(getChronosState(14, true).period).toBe('asr');
    expect(getChronosState(15, true).period).toBe('asr');
    expect(getChronosState(16, true).period).toBe('asr');
  });

  it('Maghrib period at 17:00 → 19:59', () => {
    expect(getChronosState(17, true).period).toBe('maghrib');
    expect(getChronosState(18, true).period).toBe('maghrib');
    expect(getChronosState(19, true).period).toBe('maghrib');
  });

  it('Isha period at 20:00 → 03:59 (wrap)', () => {
    expect(getChronosState(20, true).period).toBe('isha');
    expect(getChronosState(22, true).period).toBe('isha');
    expect(getChronosState(0, true).period).toBe('isha');
    expect(getChronosState(3, true).period).toBe('isha');
  });

  it('returns Arabic labels for GCC mapping', () => {
    expect(getChronosState(5, true).labelAr).toBe('الفجر');
    expect(getChronosState(9, true).labelAr).toBe('الضحى');
    expect(getChronosState(13, true).labelAr).toBe('الظهر');
    expect(getChronosState(15, true).labelAr).toBe('العصر');
    expect(getChronosState(18, true).labelAr).toBe('المغرب');
    expect(getChronosState(22, true).labelAr).toBe('العشاء');
  });

  it('returns the canonical 6 GCC gradients (no approximations)', () => {
    expect(getChronosState(5, true).gradient).toBe(
      'linear-gradient(135deg, #020408 0%, #040816 50%, #06102A 100%)',
    );
    expect(getChronosState(9, true).gradient).toBe(
      'linear-gradient(135deg, #C4DFF0 0%, #A8CCDE 50%, #90B8CC 100%)',
    );
    expect(getChronosState(18, true).gradient).toBe(
      'linear-gradient(135deg, #7A5090 0%, #4A2870 40%, #2A1050 100%)',
    );
    expect(getChronosState(22, true).gradient).toBe(
      'linear-gradient(135deg, #080D2E 0%, #0D1140 40%, #1A0D48 100%)',
    );
  });

  it('returns isGCC=true when called with gcc=true', () => {
    expect(getChronosState(9, true).isGCC).toBe(true);
  });
});

describe('getChronosState · standard mapping', () => {
  it('Pre-Dawn period at 00:00 → 05:59', () => {
    expect(getChronosState(0, false).period).toBe('pre-dawn');
    expect(getChronosState(4, false).period).toBe('pre-dawn');
    expect(getChronosState(5, false).period).toBe('pre-dawn');
  });

  it('Morning period at 06:00 → 11:59', () => {
    expect(getChronosState(6, false).period).toBe('morning');
    expect(getChronosState(9, false).period).toBe('morning');
  });

  it('Noon / Afternoon / Sunset boundaries', () => {
    expect(getChronosState(12, false).period).toBe('noon');
    expect(getChronosState(14, false).period).toBe('noon');
    expect(getChronosState(15, false).period).toBe('afternoon');
    expect(getChronosState(16, false).period).toBe('afternoon');
    expect(getChronosState(17, false).period).toBe('sunset');
    expect(getChronosState(19, false).period).toBe('sunset');
  });

  it('Night period at 20:00 → 23:59', () => {
    expect(getChronosState(20, false).period).toBe('night');
    expect(getChronosState(23, false).period).toBe('night');
  });

  it('returns isGCC=false when called with gcc=false', () => {
    expect(getChronosState(9, false).isGCC).toBe(false);
  });
});

describe('isGCCLocale', () => {
  it('matches all 5 GCC locales (case-insensitive)', () => {
    for (const lang of ['ar-OM', 'ar-SA', 'ar-AE', 'ar-QA', 'ar-BH', 'ar-om']) {
      setNavigatorLanguage(lang);
      expect(isGCCLocale()).toBe(true);
    }
  });

  it('rejects non-GCC Arabic locales', () => {
    setNavigatorLanguage('ar-EG');
    expect(isGCCLocale()).toBe(false);
    setNavigatorLanguage('ar-LB');
    expect(isGCCLocale()).toBe(false);
  });

  it('rejects non-Arabic locales', () => {
    setNavigatorLanguage('en-US');
    expect(isGCCLocale()).toBe(false);
    setNavigatorLanguage('fr-FR');
    expect(isGCCLocale()).toBe(false);
  });

  it('returns false when navigator is undefined', () => {
    setNavigatorLanguage(undefined);
    expect(isGCCLocale()).toBe(false);
  });
});
