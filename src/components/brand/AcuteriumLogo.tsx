/**
 * AcuteriumLogo · small nav-bar brand mark.
 *
 * Separate from HeroBrandLockup because nav/footer/inline usage has
 * different sizing contracts than the hero composition. Defaults to
 * 40 px which is the dashboard top-left convention.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import type { CSSProperties } from 'react';

export type AcuteriumLogoProps = {
  size?: number;
  className?: string;
  ariaLabel?: string;
  style?: CSSProperties;
};

export function AcuteriumLogo({
  size = 40,
  className,
  ariaLabel = 'Acuterium',
  style,
}: AcuteriumLogoProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/acuterium-logo-mark.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain', ...style }}
      data-qa="acuterium-logo"
    />
  );
}
