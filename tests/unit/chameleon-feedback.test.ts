/**
 * Phase B · TB-02 chameleon dual-accent + TB-03 feedback · unit tests.
 *
 * @vitest-environment jsdom
 *
 * applyChameleon writes two CSS custom properties — a primary band accent and
 * a secondary dominant-axis accent. provideFeedback is exercised for its
 * guard-rails (no throw, reduced-motion respected, preference gates).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { applyChameleon } from '../../src/engines/pathos';
import { provideFeedback } from '../../src/engines/feedback';
import type { PathosState } from '../../src/engines/types';

const BASE: PathosState = {
  stress: 20,
  focus: 20,
  curiosity: 20,
  fatigue: 20,
  satisfaction: 20,
};

function accent2(): string {
  return document.documentElement.style.getPropertyValue('--pathos-accent-2').trim();
}
function accent1(): string {
  return document.documentElement.style.getPropertyValue('--pathos-accent').trim();
}

describe('applyChameleon · dual-accent (TB-02)', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--pathos-accent');
    document.documentElement.style.removeProperty('--pathos-accent-2');
  });

  it('high stress → cool-blue primary + cool-blue dominant accent', () => {
    applyChameleon({ ...BASE, stress: 88 });
    expect(accent1()).toContain('75, 159, 255'); // cool blue band
    expect(accent2()).toContain('75, 159, 255'); // stress is dominant axis
  });

  it('high satisfaction → warm-gold primary + gold dominant accent', () => {
    applyChameleon({ ...BASE, satisfaction: 80 });
    expect(accent1()).toContain('240, 168, 74'); // warm gold band
    expect(accent2()).toContain('240, 168, 74');
  });

  it('dominant curiosity drives a distinct second accent (violet)', () => {
    applyChameleon({ ...BASE, curiosity: 75 });
    expect(accent2()).toContain('123, 104, 238'); // violet
  });

  it('dominant focus drives a bright-cyan second accent', () => {
    applyChameleon({ ...BASE, focus: 70 });
    expect(accent2()).toContain('0, 229, 212');
  });
});

describe('provideFeedback · TB-03 multi-sensory', () => {
  beforeEach(() => {
    document.body.className = '';
    document.body.classList.add('acu-master-ops');
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('does not throw for any event and sets the feedback colour', () => {
    expect(() => provideFeedback('save')).not.toThrow();
    const color = document.documentElement.style.getPropertyValue('--feedback-color').trim();
    // jsdom reports no reduced-motion by default, so the pulse path runs.
    expect(color.length).toBeGreaterThan(0);
    expect(document.body.classList.contains('acu-fb-pulse')).toBe(true);
  });

  it('every event variant is safe to fire', () => {
    for (const e of ['save', 'deny', 'report', 'mode', 'toggle'] as const) {
      expect(() => provideFeedback(e)).not.toThrow();
    }
  });
});
