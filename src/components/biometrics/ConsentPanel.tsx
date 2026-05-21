/**
 * ConsentPanel · 3-tier consent UI · Phase 3d-i.
 *
 * Mounted at /master-ops/settings/biometrics. Three radio-like cards
 * (Off · This session only · Always enable) with explicit transitions
 * and a revoke shortcut surfaced when not Off.
 *
 * Glass tokens hit the 45-55% transparency band (preflight 7.5).
 * 48 px min height keeps TUUI touch contract.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useConsent } from '../../hooks/useConsent';

interface ConsentCardProps {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
  testId?: string;
}

function ConsentCard({ active, title, detail, onClick, testId }: ConsentCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`acu-consent-card${active ? ' acu-consent-active' : ''}`}
      data-testid={testId}
    >
      <strong>{title}</strong>
      <span>{detail}</span>
    </button>
  );
}

export function ConsentPanel() {
  const { tier, grant, revoke } = useConsent('face2feel');

  return (
    <section
      className="acu-panel acu-consent-panel"
      aria-labelledby="face2feel-consent-heading"
      data-qa="face2feel-consent-panel"
    >
      <h2 id="face2feel-consent-heading" className="acu-h2">
        Face2Feel · Emotion-Aware Interface
      </h2>
      <p className="acu-body">
        Face2Feel uses your camera at 5&nbsp;fps and 320&nbsp;×&nbsp;240 to read
        facial-expression cues (focus, fatigue, stress). All inference runs in
        your browser — no video, no landmarks, no images ever leave your device.
        Only a 5-axis emotion vector is retained, and only locally.
      </p>
      <p className="acu-body">
        Read the full{' '}
        <a href="/legal/biometric" className="acu-link">
          biometric data disclosure (Article 9 GDPR)
        </a>
        .
      </p>

      <div className="acu-consent-grid" role="radiogroup" aria-label="Consent level">
        <ConsentCard
          active={tier === 'off'}
          title="Off"
          detail="Camera never activated. Default."
          onClick={() => revoke()}
          testId="consent-card-off"
        />
        <ConsentCard
          active={tier === 'session'}
          title="This session only"
          detail="Auto-revokes when you close this tab."
          onClick={() => grant('session')}
          testId="consent-card-session"
        />
        <ConsentCard
          active={tier === 'persistent'}
          title="Always enable"
          detail="Persists across tabs. Revocable anytime."
          onClick={() => grant('persistent')}
          testId="consent-card-persistent"
        />
      </div>

      {tier !== 'off' && (
        <p className="acu-body acu-muted acu-consent-active-banner" data-testid="consent-active-banner">
          Status:{' '}
          <strong>{tier === 'session' ? 'Session-only' : 'Persistent'}</strong>
          {' · '}
          <button type="button" onClick={revoke} className="acu-link-button" data-testid="consent-revoke">
            Revoke now
          </button>
        </p>
      )}
    </section>
  );
}
