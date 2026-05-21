/**
 * Vitest configuration · Phase 2.
 *
 * Scope: src/lib/cwh/** + app/api/cwh/** test suites. Node environment
 * because the CWH evaluator + AuditLog are pure-server modules and the
 * route handler runs under Next.js Node runtime.
 *
 * Coverage thresholds reflect the 12-rule contract — every rule must
 * have at least one unit test (Preflight rule 7.12).
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: [
      'src/lib/cwh/**/*.test.ts',
      'app/api/cwh/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/cwh/**/*.ts', 'app/api/cwh/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
