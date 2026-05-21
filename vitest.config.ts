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
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // server-only throws by design outside Next's RSC bundler. The runtime
      // contract (don't import this module from a client component) is still
      // enforced by Next's build pipeline; tests stub it to a no-op so the
      // server modules can be imported under vitest.
      'server-only': path.resolve(__dirname, './vitest.server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: [
      'src/lib/cwh/**/*.test.ts',
      'src/lib/sheets/**/*.test.ts',
      'app/api/cwh/**/*.test.ts',
      'app/api/sheets/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/cwh/**/*.ts',
        'src/lib/sheets/**/*.ts',
        'app/api/cwh/**/*.ts',
        'app/api/sheets/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
});
