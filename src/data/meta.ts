/**
 * Surface metadata · single source of truth for ASIP / TokenBridge state.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 568-579.
 */
export const META = {
  asip: {
    soulInfusion: '[ACU-MASTER-OPS] [SOVEREIGN] [ACAI-V2]',
    tokenBridge: { act: true, int: true, con: true },
  },
  surface: 'master-project.acuterium.ai',
  sheetId: '1o8x4HhH9H5BvuumqHz9FvrCeLCIlIa-j9I5f29HHea8',
  repo: 'github.com/Acuterium-Technologies/acuterium-master-project-dashboard',
  localMirror: 'C:\\Acuterium-Campaign-Hub\\',
  docVersion: 'v1.4',
  // Build-time stamp (set by next.config.js `env.NEXT_PUBLIC_BUILD_TIME` on each
  // deploy) so the footer "last updated" reflects the latest deploy instead of a
  // frozen date. Falls back to the original constant for local/dev builds.
  generated: process.env.NEXT_PUBLIC_BUILD_TIME || '2026-05-21T08:00:00+04:00',
  classification: 'ACUTERIUM-INTERNAL // SOVEREIGN',
  doctrine: 'Perplexity Commands · Claude Engineers · Cowork Coordinates · Sovereignty Delivers',
} as const;
