/**
 * GDPR Article 9 + Oman PDPL biometric disclosure · Phase 3d-i.06.
 *
 * Public route — NOT gated by DASHBOARD_ACCESS_TOKEN. The legal disclosure
 * must be readable by anyone deciding whether to grant consent. Verified
 * in middleware.ts carve-out and matched by the Playwright spec.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type { Metadata } from 'next';
import Link from 'next/link';

import '../../../src/styles/master-ops.css';
import '../../../src/styles/biometrics.css';

export const metadata: Metadata = {
  title: 'Biometric Data Disclosure · Acuterium',
  description:
    'GDPR Article 9 + Oman PDPL disclosure for the Face2Feel sensor channel. Edge-only processing · no cloud transmission · explicit consent required.',
};

export default function BiometricDisclosurePage() {
  return (
    <main className="acu-master-ops acu-legal-page" lang="en" dir="ltr" data-qa="biometric-disclosure">
      <p className="acu-lede">
        Read this disclosure also in{' '}
        <Link href="/ar/legal/biometric" className="acu-link" lang="ar" dir="rtl">
          العربية
        </Link>
        .
      </p>

      <h1>Biometric Data Processing Disclosure</h1>

      <p>
        Under EU GDPR Article 9 and Oman&apos;s Personal Data Protection Law
        (Royal Decree 6/2022), biometric data is a <em>special category</em>
        requiring explicit consent and transparent disclosure of processing.
        This page is the canonical disclosure for the Face2Feel sensor channel
        in the Acuterium Master Operations dashboard.
      </p>

      <h2>What we process</h2>
      <ul>
        <li>Camera frames at 5&nbsp;fps · 320&nbsp;×&nbsp;240 resolution</li>
        <li>Facial landmarks (468 points · MediaPipe Face Mesh)</li>
        <li>
          A 7-emotion probability vector (neutral / happy / sad / angry / fearful /
          disgusted / surprised)
        </li>
      </ul>

      <h2>What we retain</h2>
      <ul>
        <li>
          A 5-axis emotion vector
          (<strong>Stress</strong>, <strong>Focus</strong>,{' '}
          <strong>Curiosity</strong>, <strong>Fatigue</strong>,{' '}
          <strong>Satisfaction</strong>)
        </li>
        <li>Stored only in your browser&apos;s local storage</li>
        <li>Never transmitted to any server</li>
      </ul>

      <h2>What we delete immediately</h2>
      <ul>
        <li>Every camera frame (within 16&nbsp;ms of capture)</li>
        <li>Every facial-landmark array (within the same animation frame)</li>
        <li>Every raw emotion vector (after PATHOS mapping)</li>
      </ul>

      <h2>Where processing happens</h2>
      <p>
        100% in your browser. All ML models (MediaPipe Tasks Vision, face-api.js)
        are downloaded once from this site and cached locally by the service
        worker. There is no cloud inference, no third-party data processor.
        The Acuterium platform never receives your biometric data.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>
          Revoke consent at any time from{' '}
          <Link href="/master-ops/settings/biometrics" className="acu-link">
            Settings · Biometrics
          </Link>
          .
        </li>
        <li>Data Subject Access Request (DSAR): arriving in Phase 3d-v.</li>
        <li>Right to erasure: clears local-storage entries entirely.</li>
      </ul>

      <h2>Legal basis</h2>
      <p>
        Article 9(2)(a) GDPR — explicit consent. Default state is{' '}
        <strong>Off</strong>. Each consent tier (Session-only · Persistent)
        requires affirmative user action. The dashboard records the granted
        tier, timestamp, and consent-version locally.
      </p>

      <h2>Data controller</h2>
      <p>
        Acuterium Technologies Inc. · Muscat, Sultanate of Oman ·
        Compliance contact:{' '}
        <a href="mailto:chairman@celebrity-global.com" className="acu-link">
          chairman@celebrity-global.com
        </a>
        .
      </p>
      <p>
        Cross-border transfer notice: <strong>None</strong>. All processing is
        local to the visiting browser; no biometric data crosses any network.
      </p>

      <h2>Open-source attribution</h2>
      <ul>
        <li>
          MediaPipe Tasks Vision · Apache-2.0 ·{' '}
          <a href="/models/face2feel/LICENSE-Apache-2.0.txt" className="acu-link">
            license
          </a>
        </li>
        <li>
          face-api.js · MIT ·{' '}
          <a href="/models/face2feel/LICENSE-MIT.txt" className="acu-link">
            license
          </a>
        </li>
        <li>TensorFlow.js · Apache-2.0 (transitive)</li>
      </ul>
    </main>
  );
}
