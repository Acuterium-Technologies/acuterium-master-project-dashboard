/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
