/**
 * Sentinel screen indicator · Phase 3d-i.02.
 *
 * Mandatory non-dismissible cam-active marker. The doctrine guarantee is
 * that whenever a sensor channel is live, this dot is visible above all
 * UI chrome at z-index 99999. Pointer events never blocked.
 *
 * Future channels (voice2feel · 3d-ii · amber, touch2feel · 3d-iii · cyan)
 * shift left of the cam dot in 32 px increments — the POSITIONS table
 * here is the source of truth.
 *
 * Reduced-motion preference suppresses the pulse ring animation; solid
 * inner dot remains visible for the doctrinal guarantee (preflight 7.21).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

export type SentinelChannel = 'face2feel' | 'voice2feel' | 'touch2feel';
export type SentinelState = 'inactive' | 'active' | 'paused';

interface SentinelDotProps {
  channel: SentinelChannel;
  state: SentinelState;
}

const COLORS: Record<SentinelChannel, string> = {
  face2feel: '#ef4444',
  voice2feel: '#f59e0b',
  touch2feel: '#00E5D4',
};

const POSITIONS: Record<SentinelChannel, { top: string; right: string }> = {
  face2feel: { top: '16px', right: '16px' },
  voice2feel: { top: '16px', right: '48px' },
  touch2feel: { top: '16px', right: '80px' },
};

const SENTINEL_Z_INDEX = 99999;
const PAUSED_COLOR = '#f59e0b';

export function SentinelDot({ channel, state }: SentinelDotProps) {
  if (state === 'inactive') return null;

  const color = state === 'paused' ? PAUSED_COLOR : COLORS[channel];
  const pos = POSITIONS[channel];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${channel} sensor ${state}`}
      data-testid={`sentinel-${channel}`}
      data-state={state}
      style={{
        position: 'fixed',
        top: pos.top,
        right: pos.right,
        width: '16px',
        height: '16px',
        pointerEvents: 'none',
        zIndex: SENTINEL_Z_INDEX,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '4px',
          top: '4px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span
        aria-hidden
        className={state === 'active' ? 'acu-sentinel-ring' : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: state === 'active' ? 0.4 : 0.25,
        }}
      />
    </div>
  );
}
