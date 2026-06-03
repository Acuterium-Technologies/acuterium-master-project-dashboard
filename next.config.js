/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Stamp every build with its UTC timestamp so the dashboard footer can show a
  // real "last updated" instead of a frozen constant. Evaluated when `next
  // build` runs, so it refreshes on each Vercel deploy.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString()
  },
  experimental: {
    serverActions: { allowedOrigins: ['master-project.acuterium.ai'] }
  },
  webpack: (config, { isServer }) => {
    // face-api.js references Node 'fs'/'path' for an optional file-loading
    // code path. It only runs inside the Face2Feel web worker via dynamic
    // import — never in the main client bundle — so the modules are never
    // actually needed in the browser. Provide empty fallbacks so webpack
    // stops emitting the non-fatal "Module not found: Can't resolve 'fs'"
    // warning during the client build.
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Phase 3d-i · camera=(self) gates same-origin Face2Feel sensor.
          // Microphone + geolocation stay closed until Phase 3d-ii / 3d-iii.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' }
        ]
      },
      {
        // Force the navigational HTML document to always revalidate so a new
        // deploy is picked up without a manual hard-refresh. This only targets
        // the page routes — hashed assets under /_next/static keep Next.js's
        // immutable long-cache (their filenames change per build).
        source: '/master-ops/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }]
      },
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }]
      }
    ];
  }
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true
    })
  : nextConfig;
