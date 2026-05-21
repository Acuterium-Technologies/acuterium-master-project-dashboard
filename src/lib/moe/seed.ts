/**
 * MOE expert domain assignment · Phase 3b.02.
 *
 * Each of the 785 experts is permanently bound to one of 6 domains
 * via a Fisher-Yates shuffle with a FIXED seed — so the visual layout
 * in the canvas stays stable across reloads (operator memorises which
 * tiles light up for which domain).
 *
 * Domain ratios (sum = 785, ACAI V2 canon):
 *   language   220
 *   reasoning  180
 *   code       140
 *   legal      100
 *   finance     90
 *   security    55
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { EXPERT_DOMAINS, TOTAL_EXPERTS, type ExpertDomain } from './types';

const DOMAIN_RATIOS: ReadonlyArray<readonly [ExpertDomain, number]> = [
  ['language', 220],
  ['reasoning', 180],
  ['code', 140],
  ['legal', 100],
  ['finance', 90],
  ['security', 55],
];

const SEED = 0x0ace7e40;

function shuffle<T>(arr: T[], seed: number): T[] {
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    // 32-bit Linear Congruential Generator · stable across V8 / SpiderMonkey / JSC.
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildAssignments(): ExpertDomain[] {
  const sum = DOMAIN_RATIOS.reduce((a, [, n]) => a + n, 0);
  if (sum !== TOTAL_EXPERTS) {
    throw new Error(`MOE domain ratios sum to ${sum}, expected ${TOTAL_EXPERTS}`);
  }
  const arr: ExpertDomain[] = [];
  for (const [domain, count] of DOMAIN_RATIOS) {
    for (let i = 0; i < count; i++) arr.push(domain);
  }
  return shuffle(arr, SEED);
}

export const EXPERT_DOMAINS_LIST: readonly ExpertDomain[] = buildAssignments();

export function domainOf(expertId: number): ExpertDomain {
  return EXPERT_DOMAINS_LIST[expertId];
}

// Canon export so the test file can verify the 6-domain enum hasn't drifted.
export { EXPERT_DOMAINS };
