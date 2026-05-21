/**
 * Hero Brand Guardrail · Acuterium logo presentation contract.
 *
 * Doctrinal alignment: D-08 (Naming Canon — visual extension) and
 * D-11 (7-Layer · L5 Output Discipline). Converts hero logo sizing
 * from a freeform decision into a governed component contract.
 *
 * The variants here are the only approved sizes. Executive dashboard
 * surfaces (this dashboard) cap at `standard`; campaign pages may use
 * `prominent` only after explicit visual review.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
export const HERO_BRAND_GUARDRAIL = {
  variants: {
    compact: { desktop: 72, mobile: 52 },
    standard: { desktop: 96, mobile: 64 },
    prominent: { desktop: 120, mobile: 80 },
  },
  rules: {
    defaultVariant: 'compact',
    maxAllowedVariantForDashboard: 'standard',
    preserveAspectRatio: true,
    requireFrameWrapper: true,
    requireResponsiveTokens: true,
    requireVisualReview: true,
  },
} as const;

export type HeroBrandVariant = keyof typeof HERO_BRAND_GUARDRAIL.variants;

/**
 * Dev-only runtime assertion. Logs a warning when the logo frame
 * exceeds the approved 120 px dashboard ceiling. Tree-shaken out
 * of production builds via the NODE_ENV guard.
 */
export function assertHeroLogoSize(el: HTMLElement | null): void {
  if (!el) return;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return;

  const rect = el.getBoundingClientRect();
  if (rect.width > 120 || rect.height > 120) {
    // eslint-disable-next-line no-console
    console.warn(
      '[HeroBrandGuardrail] Hero logo exceeds approved dashboard max of 120px.',
      { width: rect.width, height: rect.height },
    );
  }
}
