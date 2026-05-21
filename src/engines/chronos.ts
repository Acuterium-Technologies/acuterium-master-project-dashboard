/**
 * CHRONOS · temporal awareness engine · Phase 3c.01.
 *
 * Adapts the dashboard background gradient to the user's local hour-of-day.
 * GCC locales (Oman, Saudi Arabia, UAE, Qatar, Bahrain) get the 6 Islamic
 * prayer-time periods (Fajr · Duha · Dhuhr · Asr · Maghrib · Isha) on a
 * fixed hour-boundary fallback (real prayer-time API is Phase 4 candidate).
 * Non-GCC locales get the 6 standard time-of-day periods.
 *
 * Detection: navigator.language regex /^ar-(OM|SA|AE|QA|BH)$/i — privacy by
 * default, no IP geolocation. Graceful fallback to standard mapping when
 * navigator is unavailable or the language doesn't match.
 *
 * Side-effects (applyChronos):
 *   document.documentElement.style.setProperty('--chronos-gradient', …)
 *   document.documentElement.dataset.chronosPeriod = <period>
 *   document.documentElement.dataset.chronosGcc    = 'true' | 'false'
 *
 * Update cadence: 10 minutes (not seconds — no animation thrash).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useState } from 'react';

export type ChronosPeriod =
  | 'fajr'
  | 'duha'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'pre-dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'sunset'
  | 'night';

export interface ChronosState {
  period: ChronosPeriod;
  gradient: string;
  labelEn: string;
  labelAr: string;
  isGCC: boolean;
  hour: number;
}

interface PeriodSpec {
  from: number;
  to: number;
  period: ChronosPeriod;
  gradient: string;
  labelEn: string;
  labelAr: string;
}

const GCC_PERIODS: readonly PeriodSpec[] = [
  {
    from: 4,
    to: 6,
    period: 'fajr',
    labelEn: 'Fajr',
    labelAr: 'الفجر',
    gradient: 'linear-gradient(135deg, #020408 0%, #040816 50%, #06102A 100%)',
  },
  {
    from: 6,
    to: 12,
    period: 'duha',
    labelEn: 'Duha',
    labelAr: 'الضحى',
    gradient: 'linear-gradient(135deg, #C4DFF0 0%, #A8CCDE 50%, #90B8CC 100%)',
  },
  {
    from: 12,
    to: 14,
    period: 'dhuhr',
    labelEn: 'Dhuhr',
    labelAr: 'الظهر',
    gradient: 'linear-gradient(135deg, #B8D8EA 0%, #A4CAE0 45%, #8FB5CC 100%)',
  },
  {
    from: 14,
    to: 17,
    period: 'asr',
    labelEn: 'Asr',
    labelAr: 'العصر',
    gradient: 'linear-gradient(135deg, #B0B8DC 0%, #96A4CC 40%, #7888BC 100%)',
  },
  {
    from: 17,
    to: 20,
    period: 'maghrib',
    labelEn: 'Maghrib',
    labelAr: 'المغرب',
    gradient: 'linear-gradient(135deg, #7A5090 0%, #4A2870 40%, #2A1050 100%)',
  },
];

const STD_PERIODS: readonly PeriodSpec[] = [
  {
    from: 0,
    to: 6,
    period: 'pre-dawn',
    labelEn: 'Pre-Dawn',
    labelAr: 'الفجر',
    gradient: 'linear-gradient(135deg, #020510 0%, #050820 100%)',
  },
  {
    from: 6,
    to: 12,
    period: 'morning',
    labelEn: 'Morning',
    labelAr: 'الضحى',
    gradient: 'linear-gradient(135deg, #B8D8EA 0%, #A4CAE0 100%)',
  },
  {
    from: 12,
    to: 15,
    period: 'noon',
    labelEn: 'Noon',
    labelAr: 'الظهر',
    gradient: 'linear-gradient(135deg, #B0C8E0 0%, #9AB8D0 100%)',
  },
  {
    from: 15,
    to: 17,
    period: 'afternoon',
    labelEn: 'Afternoon',
    labelAr: 'العصر',
    gradient: 'linear-gradient(135deg, #A8B8D8 0%, #8898C8 100%)',
  },
  {
    from: 17,
    to: 20,
    period: 'sunset',
    labelEn: 'Sunset',
    labelAr: 'المغرب',
    gradient: 'linear-gradient(135deg, #6A4A8A 0%, #3A2060 100%)',
  },
];

const ISHA: PeriodSpec = {
  from: 20,
  to: 24,
  period: 'isha',
  labelEn: 'Isha',
  labelAr: 'العشاء',
  gradient: 'linear-gradient(135deg, #080D2E 0%, #0D1140 40%, #1A0D48 100%)',
};

const STD_NIGHT: PeriodSpec = {
  from: 20,
  to: 24,
  period: 'night',
  labelEn: 'Night',
  labelAr: 'الليل',
  gradient: 'linear-gradient(135deg, #030509 0%, #05071A 100%)',
};

const GCC_LOCALE_RE = /^ar-(OM|SA|AE|QA|BH)$/i;

export const CHRONOS_REEVAL_MS = 10 * 60 * 1000;

export function isGCCLocale(): boolean {
  if (typeof navigator === 'undefined') return false;
  const lang =
    navigator.language ||
    (navigator as { languages?: readonly string[] }).languages?.[0] ||
    '';
  return GCC_LOCALE_RE.test(lang);
}

function findPeriod(periods: readonly PeriodSpec[], hour: number): PeriodSpec | null {
  for (const p of periods) {
    if (hour >= p.from && hour < p.to) return p;
  }
  return null;
}

/**
 * Resolve the CHRONOS state for a given hour + locale flag.
 * Pure function — testable without DOM.
 */
export function getChronosState(
  hour: number = new Date().getHours(),
  gcc?: boolean,
): ChronosState {
  const isGCC = gcc ?? isGCCLocale();
  const periods = isGCC ? GCC_PERIODS : STD_PERIODS;
  const fallback = isGCC ? ISHA : STD_NIGHT;
  const match = findPeriod(periods, hour) ?? fallback;
  return {
    period: match.period,
    gradient: match.gradient,
    labelEn: match.labelEn,
    labelAr: match.labelAr,
    isGCC,
    hour,
  };
}

/**
 * Apply CHRONOS to the document — sets --chronos-gradient, dataset hooks.
 * Returns the resolved state for the caller to render labels off.
 */
export function applyChronos(): ChronosState {
  const state = getChronosState();
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--chronos-gradient', state.gradient);
    document.documentElement.dataset.chronosPeriod = state.period;
    document.documentElement.dataset.chronosGcc = String(state.isGCC);
  }
  return state;
}

/**
 * React hook: apply CHRONOS on mount, re-evaluate every 10 minutes,
 * and re-evaluate if the user agent fires a `chronos:reeval` event
 * (testing escape hatch — Playwright mock-clock dispatches this).
 */
export function useChronos(): ChronosState {
  const [state, setState] = useState<ChronosState>(() => getChronosState());

  useEffect(() => {
    setState(applyChronos());
    const id = window.setInterval(() => setState(applyChronos()), CHRONOS_REEVAL_MS);
    const onReeval = () => setState(applyChronos());
    window.addEventListener('chronos:reeval', onReeval);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('chronos:reeval', onReeval);
    };
  }, []);

  return state;
}
