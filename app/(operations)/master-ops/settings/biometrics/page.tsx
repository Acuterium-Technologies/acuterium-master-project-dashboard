/**
 * Biometrics settings · Phase 3d-i.
 *
 * Per-channel consent management. Phase 3d-i ships Face2Feel only.
 * Voice2Feel (3d-ii) and Touch2Feel (3d-iii) panels mount here too
 * once the corresponding ConsentPanel variants land.
 *
 * Gated behind the operations route group, so the dashboard
 * DASHBOARD_ACCESS_TOKEN cookie applies (preflight 7.7 leak-fix intact).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type { Metadata } from 'next';

import { ConsentPanel } from '../../../../../src/components/biometrics/ConsentPanel';
import '../../../../../src/styles/biometrics.css';

export const metadata: Metadata = {
  title: 'Biometrics · Master Operations · Acuterium',
  description:
    'Edge-only biometric sensing. Per-channel consent. GDPR Article 9.',
};

export default function BiometricsSettingsPage() {
  return (
    <main className="acu-master-ops acu-page-wrap acu-biometrics-page" data-qa="biometrics-settings">
      <header className="acu-biometrics-header">
        <h1 className="acu-h1">Biometric Sensing</h1>
        <p className="acu-lede">
          Multi-modal emotional intelligence for the consciousness-aware interface.
          All data is processed at the edge and never transmitted. Default state is
          Off · explicit consent required for each channel · revocable at any time.
        </p>
      </header>

      <ConsentPanel />

      {/* Voice2Feel ConsentPanel arrives in Phase 3d-ii */}
      {/* Touch2Feel ConsentPanel arrives in Phase 3d-iii */}
    </main>
  );
}
