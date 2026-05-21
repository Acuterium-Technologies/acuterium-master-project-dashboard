// Vitest-only stub for Next.js's `server-only` import marker.
// Next's bundler treats this import as a build-time assertion; under
// vitest we replace it with an empty module so server modules can be
// imported directly by their .test.ts neighbors.
export {};
