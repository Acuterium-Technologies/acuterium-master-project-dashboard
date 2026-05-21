/**
 * BiometricStatusBadge · Phase 3d-i.06.
 *
 * Compact status pill for the dashboard right rail. Shows Face2Feel state
 * (off · pending · active) and live confidence when active.
 *
 * Voice2Feel / Touch2Feel rows mount alongside in Phase 3d-ii / 3d-iii.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useFace2Feel } from '../../hooks/useFace2Feel';

export function BiometricStatusBadge() {
  const { tier, isActive, lastConfidence } = useFace2Feel();

  const stateClass =
    tier === 'off' ? 'acu-status-off' : isActive ? 'acu-status-on' : 'acu-status-pending';

  return (
    <div className="acu-status-badge" data-testid="biometric-status" data-qa="biometric-status">
      <div className="acu-status-row">
        <span className="acu-status-icon" aria-hidden>
          F2F
        </span>
        <span className="acu-status-label">Face2Feel</span>
        <span
          className={`acu-status-dot ${stateClass}`}
          aria-label={`Face2Feel status: ${tier === 'off' ? 'off' : isActive ? 'active' : 'pending'}`}
        />
      </div>
      {isActive && (
        <div className="acu-status-meta">
          Confidence: {Math.round(lastConfidence * 100)}%
        </div>
      )}
      {/* Voice2Feel row arrives in Phase 3d-ii */}
      {/* Touch2Feel row arrives in Phase 3d-iii */}
    </div>
  );
}
