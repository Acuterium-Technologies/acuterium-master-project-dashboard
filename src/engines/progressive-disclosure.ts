/**
 * Progressive Disclosure · Phase A.
 *
 * Derives an operator EXPERTISE TIER from the persistent MNEMOS profile
 * (sessions · mode diversity · exploration score) and reflects it as a body
 * class — `acu-expertise-{novice|proficient|expert}` — so the surface can
 * densify / reveal advanced affordances for experienced operators without any
 * manual setting (HUG2UI methodology).
 *
 * This is the foundation hook: components opt in by tagging optional hints with
 * `.acu-hint` (hidden for experts) or reading the returned tier directly.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect } from 'react';
import type { MnemosProfile } from './types';

export type ExpertiseTier = 'novice' | 'proficient' | 'expert';

export function expertiseTier(profile: MnemosProfile): ExpertiseTier {
  const sessions = profile.sessions ?? 1;
  const modeDiversity = new Set(profile.modeHistory ?? []).size;
  const exploration = profile.explorationScore ?? 50;

  if (sessions >= 8 || (modeDiversity >= 4 && exploration >= 60)) return 'expert';
  if (sessions >= 3 || modeDiversity >= 2) return 'proficient';
  return 'novice';
}

const ALL = ['acu-expertise-novice', 'acu-expertise-proficient', 'acu-expertise-expert'];

export function useProgressiveDisclosure(profile: MnemosProfile): ExpertiseTier {
  const tier = expertiseTier(profile);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    ALL.forEach((c) => body.classList.remove(c));
    body.classList.add('acu-expertise-' + tier);
    return () => {
      body.classList.remove('acu-expertise-' + tier);
    };
  }, [tier]);

  return tier;
}
