/**
 * HeroBrandLockup · governed Acuterium hero composition.
 *
 * Doctrinal alignment: D-08 visual extension · D-11 L5 Output Discipline.
 * Converts hero logo presentation from page-level styling decisions into
 * a single component contract with three approved size variants.
 *
 * Default variant `compact` (72 px desktop / 52 px mobile) is appropriate
 * for the executive dashboard surface. `standard` is the dashboard ceiling
 * per HERO_BRAND_GUARDRAIL.rules.maxAllowedVariantForDashboard. `prominent`
 * requires explicit visual review.
 *
 * Includes a dev-only runtime assertion via assertHeroLogoSize() that
 * surfaces a console warning when the rendered frame exceeds 120 px.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { assertHeroLogoSize, type HeroBrandVariant } from '../../lib/brand/heroBrandGuardrail';

type HeroBrandLockupAlign = 'start' | 'center';

export type HeroBrandLockupProps = {
  logoSrc?: string;
  logoAlt?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  variant?: HeroBrandVariant;
  align?: HeroBrandLockupAlign;
  className?: string;
};

const DEFAULT_LOGO_SRC = '/brand/acuterium-logo.svg';

export function HeroBrandLockup({
  logoSrc = DEFAULT_LOGO_SRC,
  logoAlt = 'Acuterium logo',
  eyebrow = 'Acuterium Master Operations',
  title,
  subtitle,
  meta,
  variant = 'compact',
  align = 'start',
  className,
}: HeroBrandLockupProps) {
  const logoFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    assertHeroLogoSize(logoFrameRef.current);
  }, [variant]);

  const classes = [
    'acu-hero-lockup',
    `acu-hero-lockup--${variant}`,
    `acu-hero-lockup--${align}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} data-qa="hero-lockup" data-qa-variant={variant}>
      <div className="acu-hero-lockup__content" data-qa="hero-content">
        <div className="acu-hero-lockup__brand-row">
          <div
            ref={logoFrameRef}
            className="acu-hero-lockup__logo-frame"
            data-qa="hero-logo-frame"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={logoAlt} className="acu-hero-lockup__logo" data-qa="hero-logo" />
          </div>

          <div className="acu-hero-lockup__text-block">
            {eyebrow ? (
              <p className="acu-hero-lockup__eyebrow" data-qa="hero-eyebrow">
                {eyebrow}
              </p>
            ) : null}

            <h1 className="acu-hero-lockup__title" data-qa="hero-title">
              {title}
            </h1>

            {subtitle ? (
              <p className="acu-hero-lockup__subtitle" data-qa="hero-subtitle">
                {subtitle}
              </p>
            ) : null}

            {meta ? (
              <div className="acu-hero-lockup__meta" data-qa="hero-meta">
                {meta}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
