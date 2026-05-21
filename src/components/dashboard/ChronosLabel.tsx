/**
 * CHRONOS label · consciousness-bar component · Phase 3c.01.
 *
 * `variant="compact"` — small pill for the dashboard top strip.
 *   GCC locales render the Arabic label (الفجر · الضحى · ...) with dir=rtl.
 *   Non-GCC locales render the English label.
 *
 * `variant="full"` — wider strip with bilingual labels + hour, suitable
 *   for the consciousness-bar / settings panel.
 *
 * Both variants probe `useChronos()` directly so the 10-min re-evaluation
 * is automatic without prop drilling.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useChronos } from '../../engines/chronos';

export interface ChronosLabelProps {
  variant?: 'compact' | 'full';
}

export function ChronosLabel({ variant = 'compact' }: ChronosLabelProps) {
  const state = useChronos();
  const lang = state.isGCC ? 'ar' : 'en';
  const dir = state.isGCC ? 'rtl' : 'ltr';
  const label = state.isGCC ? state.labelAr : state.labelEn;

  if (variant === 'compact') {
    return (
      <span
        className="acu-chronos-label"
        data-qa="chronos-label"
        data-period={state.period}
        data-gcc={String(state.isGCC)}
        lang={lang}
        dir={dir}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className="acu-chronos-label acu-chronos-label--full"
      data-qa="chronos-label-full"
      data-period={state.period}
      data-gcc={String(state.isGCC)}
    >
      <span className="acu-chronos-label__en">{state.labelEn}</span>
      <span className="acu-chronos-label__ar" lang="ar" dir="rtl">
        {state.labelAr}
      </span>
      <span className="acu-chronos-label__hour">
        {state.hour.toString().padStart(2, '0')}:00
      </span>
    </div>
  );
}
