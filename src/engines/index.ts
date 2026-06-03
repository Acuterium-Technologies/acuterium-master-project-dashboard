/**
 * Cognitive engines barrel · ported v1.3 lines 2375-2742.
 *
 *   MNEMOS  · persistent operator profile (localStorage)
 *   NEXUS   · 1.5s behavioral signal aggregates
 *   PATHOS  · 5-axis emotion state + breathing-rate writer
 *   KAIROS  · 6-mode auto-switch + keyboard shortcuts + TUUI ripples
 *   TELOS   · top-4 ranked intent predictions
 *
 * Phase 1E will spawn the engine pipeline at the App() root in
 * app/(operations)/master-ops/page.tsx.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
export { MNEMOS, MNEMOS_KEY } from './mnemos';
export { useNEXUS } from './nexus';
export { computePATHOS, applyBreathing, applyChameleon } from './pathos';
export type { ComputePathosArgs } from './pathos';
export { useProgressiveDisclosure, expertiseTier } from './progressive-disclosure';
export type { ExpertiseTier } from './progressive-disclosure';
export { PathosSidebar } from './PathosSidebar';
export type { PathosSidebarProps } from './PathosSidebar';
export {
  useKAIROS,
  useTUUIRipples,
  showModeToast,
  KAIROS_MODES,
  MODE_LABELS,
} from './kairos';
export type { UseKairosArgs, UseKairosResult } from './kairos';
export { computeTELOS } from './telos';
export type { ComputeTelosArgs } from './telos';
export { TelosPanel } from './TelosPanel';
export type { TelosPanelProps } from './TelosPanel';
export type {
  KairosMode,
  PathosState,
  NexusSignals,
  MnemosProfile,
  TelosPrediction,
} from './types';
