# Spec 3c.04 · Aurora Hero Stagger Animation

**Sub-phase:** 3c
**Owner:** Claude Code · Perplexity custodian
**Status:** Approved
**Estimated time:** 20 min
**Closes:** ACAI V2 conformance · Aurora hero stagger 50% → 100%

---

## Why

ACAI V2 canon defines the hero as a 3-word stagger reveal on cold load. Current `HeroBrandLockup` renders the hero correctly but with a single fade-in (or none). Phase 3c.04 adds the canonical 3-word stagger:

- Word 1 reveals at 0.2 s delay
- Word 2 reveals at 0.5 s delay
- Word 3 reveals at 0.8 s delay
- Each word: opacity 0 → 1, translateY 30 px → 0, gradient text fill
- Total animation duration: 800 ms per word

For master-ops the 3 words are: **MASTER · OPERATIONS · ACUTERIUM**

## Out of scope

- Per-letter stagger (canon is per-word · per-letter is overkill)
- Sound effects on reveal (Phase 5+ candidate)
- Mid-page hero variants (this spec only touches the master-ops top-of-page hero)

## Activation

- Fires on COLD PAGE LOAD only (first paint after navigation to `/master-ops`)
- Does NOT fire on mode switch
- Does NOT fire on tab refocus
- Does NOT fire on hot module replacement during dev

Detection via:

```typescript
useEffect(() => {
  const isColdLoad = !window.sessionStorage.getItem('acu-hero-revealed');
  if (isColdLoad) {
    setShouldAnimate(true);
    window.sessionStorage.setItem('acu-hero-revealed', '1');
  }
}, []);
```

This ensures the animation fires once per browser tab session.

## Modifications to existing files

### `src/components/brand/HeroBrandLockup.tsx`

Update to support stagger:

```typescript
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
  /** Optional split title into stagger words (e.g., ["MASTER", "OPERATIONS", "ACUTERIUM"]). If unset, title renders as a single string without stagger. */
  staggerWords?: string[];
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
    if (!staggerWords) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const isColdLoad = !window.sessionStorage.getItem('acu-hero-revealed');
    if (isColdLoad) {
      setShouldStagger(true);
      window.sessionStorage.setItem('acu-hero-revealed', '1');
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
              {staggerWords && shouldStagger ? (
                <span className="acu-hero-stagger" data-qa="hero-stagger">
                  {staggerWords.map((word, i) => (
                    <span key={i} className="acu-hero-word" data-delay={i} style={{ animationDelay: `${0.2 + i * 0.3}s` }}>
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
```

### `src/styles/hero-brand-lockup.css`

Add stagger keyframes + class rules:

```css
.acu-hero-stagger {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.acu-hero-word {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.12em;
  background: linear-gradient(135deg, var(--cyan-prime) 0%, var(--gold-prime) 50%, var(--cyan-bright) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transform: translateY(30px);
  animation: heroReveal 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes heroReveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced motion: skip animation, show final state */
@media (prefers-reduced-motion: reduce) {
  .acu-hero-word {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

### `app/master-ops/page.tsx`

Pass `staggerWords` to the hero:

```typescript
<HeroBrandLockup
  variant="compact"
  staggerWords={['MASTER', 'OPERATIONS', 'ACUTERIUM']}
  title="Master Operations · Acuterium"
  eyebrow="Acuterium Master Operations"
  subtitle="..."
/>
```

Note: `title` is the fallback for screen readers / no-stagger cases. `staggerWords` is the visual override.

## Doctrinal red-lines

- Animation fires once per session (sessionStorage guard)
- `prefers-reduced-motion: reduce` → no animation
- Reveal delays are canonical (0.2 / 0.5 / 0.8 s — not 0.1 / 0.4 / 0.7)
- Words use Cinzel font (canonical hero typeface)
- Gradient stops are canonical (cyan-prime → gold-prime → cyan-bright)
- No external animation library (no GSAP, no anime.js · CSS-only)
- sessionStorage key is `acu-hero-revealed` (NOT bumped to v2)

## Tests

### Vitest

`src/components/brand/HeroBrandLockup.test.tsx`:

1. Without `staggerWords` prop → renders title as single string (no stagger element)
2. With `staggerWords` + cold load → renders stagger element with each word
3. With `staggerWords` + sessionStorage flag already set → renders title without stagger (already revealed this session)
4. With `staggerWords` + reduced-motion preference → renders title without stagger
5. Each word receives correct `animation-delay` style (0.2s, 0.5s, 0.8s)
6. After first render with stagger, sessionStorage flag is set

### Playwright (in `tests/living-interface.spec.ts`)

7. Cold load `/master-ops` → 3 `.acu-hero-word` elements rendered
8. Refresh → 0 `.acu-hero-word` elements (already revealed)
9. Set `prefers-reduced-motion: reduce` → 0 `.acu-hero-word` elements

## Acceptance criteria

- [ ] `<HeroBrandLockup staggerWords={['MASTER', 'OPERATIONS', 'ACUTERIUM']}>` renders 3 staggered words
- [ ] Animation fires only on cold load (verified via sessionStorage)
- [ ] Reduced-motion preference skips animation
- [ ] Words use Cinzel font + canonical gradient
- [ ] Stagger delays are 0.2 / 0.5 / 0.8 s
- [ ] Animation duration is 800 ms each
- [ ] All 9 tests pass
- [ ] Bundle delta < +1 kB
- [ ] Preflight 7.16 (base CSS for `.acu-hero-stagger` + `.acu-hero-word` defined)
- [ ] Preflight 7.21 (reduced-motion)
