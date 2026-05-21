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

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { assertHeroLogoSize, type HeroBrandVariant } from '../../lib/brand/heroBrandGuardrail';

type HeroBrandLockupAlign = 'start' | 'center';

export type HeroBrandLockupProps = {
  logoSrc?: string;
  logoAlt?: string;
  eyebrow?: string;
  title: string;
  /**
   * Optional canonical 3-word triplet for cold-load stagger reveal.
   * Phase 3c.04 · cold load only via sessionStorage key 'acu-hero-revealed'.
   * When unset, the title renders as a single string (no stagger).
   */
  staggerWords?: readonly string[];
  subtitle?: string;
  meta?: ReactNode;
  variant?: HeroBrandVariant;
  align?: HeroBrandLockupAlign;
  className?: string;
};

const DEFAULT_LOGO_SRC = '/brand/acuterium-logo.svg';
const HERO_REVEALED_KEY = 'acu-hero-revealed';

export function HeroBrandLockup({
  logoSrc = DEFAULT_LOGO_SRC,
  logoAlt = 'Acuterium logo',
  eyebrow = 'Acuterium Master Operations',
  title,
  staggerWords,
  subtitle,
  meta,
  variant = 'compact',
  align = 'start',
  className,
}: HeroBrandLockupProps) {
  const logoFrameRef = useRef<HTMLDivElement | null>(null);
  const [shouldStagger, setShouldStagger] = useState(false);

  useEffect(() => {
    assertHeroLogoSize(logoFrameRef.current);
  }, [variant]);

  useEffect(() => {
    if (!staggerWords || staggerWords.length === 0) return;
    if (typeof window === 'undefined') return;

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let alreadyRevealed = false;
    try {
      alreadyRevealed = window.sessionStorage.getItem(HERO_REVEALED_KEY) === '1';
    } catch {
      alreadyRevealed = false;
    }
    if (alreadyRevealed) return;

    setShouldStagger(true);
    try {
      window.sessionStorage.setItem(HERO_REVEALED_KEY, '1');
    } catch {
      /* ignore */
    }
  }, [staggerWords]);

  const classes = [
    'acu-hero-lockup',
    `acu-hero-lockup--${variant}`,
    `acu-hero-lockup--${align}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showStagger = !!staggerWords && staggerWords.length > 0 && shouldStagger;

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
              {showStagger ? (
                <span
                  className="acu-hero-stagger"
                  data-qa="hero-stagger"
                  aria-label={title}
                >
                  {staggerWords!.map((word, i) => (
                    <span
                      key={`${word}-${i}`}
                      className="acu-hero-word"
                      data-delay={i}
                      style={{ animationDelay: `${0.2 + i * 0.3}s` }}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              ) : (
                title
              )}
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
