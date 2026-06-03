import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const SURFACE_URL = 'https://master-project.acuterium.ai';

export const metadata: Metadata = {
  metadataBase: new URL(SURFACE_URL),
  title: 'Acuterium · Master Operations',
  description:
    'Unified Master Operations Dashboard — Acuterium Technologies Inc. · Sovereign Doctrine Surface',
  applicationName: 'Master Ops',
  // The surface is internal-gated; we still emit OG metadata for authenticated
  // share-link previews inside Slack / Linear / etc, but block search indexing.
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/brand/acuterium-logo.svg', color: '#00E5D4' }]
  },
  openGraph: {
    type: 'website',
    siteName: 'Acuterium · Master Operations',
    title: 'Acuterium · Master Operations',
    description: 'Sovereign Doctrine Surface · Acuterium Technologies Inc.',
    url: SURFACE_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Acuterium Master Operations · Sovereign Doctrine Surface'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acuterium · Master Operations',
    description: 'Sovereign Doctrine Surface · Acuterium Technologies Inc.',
    images: ['/og-image.png']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A1628'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
