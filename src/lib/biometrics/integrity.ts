/**
 * Integrity verification for self-hosted Face2Feel models · Phase 3d-i.
 *
 * Production only — verifies SHA-256 hashes of the binaries shipped in
 * /public/models/face2feel/ against INTEGRITY.json. In dev the check is
 * skipped (saves ~50 ms per refresh; the operator commits the same
 * artifacts so drift is impossible).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import integrityManifest from '../../../public/models/face2feel/INTEGRITY.json';

type IntegrityMap = Record<string, string>;

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const subtle = (
    typeof globalThis.crypto !== 'undefined' && 'subtle' in globalThis.crypto
      ? globalThis.crypto.subtle
      : undefined
  ) as SubtleCrypto | undefined;
  if (!subtle) return '';
  const digest = await subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyModelIntegrity(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  // Skip integrity in dev — saves time, dev binaries are identical to prod.
  if (process.env.NODE_ENV !== 'production') return true;

  const manifest = integrityManifest as IntegrityMap;
  for (const [relPath, expected] of Object.entries(manifest)) {
    try {
      const res = await fetch(`/models/face2feel/${relPath}`);
      if (!res.ok) {
        return false;
      }
      const buf = await res.arrayBuffer();
      const got = await sha256Hex(buf);
      if (got && got !== expected) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}
