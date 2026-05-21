/**
 * Acuterium Master Operations Dashboard — v1.4 surface
 *
 * Phase 1A status: infrastructure milestone. PWA shell wired (manifest +
 * service worker register on first paint), sheet data layer plumbed, route
 * gated by the access-token middleware. Engine modules (DOCTRINES, CWH gate,
 * chart primitives, mode components, MNEMOS/NEXUS/PATHOS/KAIROS/TELOS) land
 * in Phase 1B-D — they're being ported from ACU-Master-Ops-Dashboard-v1.3.html
 * incrementally so each milestone can be verified before the next layer ships.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useState } from 'react';

type Counts = {
  matrix: number | null;
  tasks: number | null;
  milestones: number | null;
  kpis: number | null;
};

export default function MasterOpsPage() {
  const [counts, setCounts] = useState<Counts>({
    matrix: null,
    tasks: null,
    milestones: null,
    kpis: null
  });
  const [pwaReady, setPwaReady] = useState(false);
  const [pwaError, setPwaError] = useState<string | null>(null);

  // Register the service worker (PWA install path)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      setPwaError('Service Worker not supported by this browser');
      return;
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => setPwaReady(true))
      .catch((e) => setPwaError(String(e?.message || e)));
  }, []);

  // Best-effort fetch of the four live tabs to confirm the gated data plane works
  useEffect(() => {
    const tabs: (keyof Counts)[] = ['matrix', 'tasks', 'milestones', 'kpis'];
    tabs.forEach((tab) => {
      fetch(`/api/sheet?tab=${tab}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data) => {
          const arr = Array.isArray(data) ? data : data?.[tab] || data?.rows || [];
          setCounts((c) => ({ ...c, [tab]: Array.isArray(arr) ? arr.length : 0 }));
        })
        .catch(() => setCounts((c) => ({ ...c, [tab]: 0 })));
    });
  }, []);

  return (
    <>
      {/* Self-hosted fonts (sovereign perimeter) */}
      <link rel="stylesheet" href="/sovereign-fonts.css" />

      <main
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(ellipse at 18% 20%, rgba(0,90,110,0.30) 0%, transparent 55%), ' +
            'radial-gradient(ellipse at 85% 80%, rgba(80,40,140,0.22) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%), ' +
            'linear-gradient(135deg, #030509 0%, #05071A 45%, #0A0520 100%)',
          color: 'rgba(230,245,255,0.93)',
          fontFamily: "'Sora', system-ui, -apple-system, sans-serif",
          padding: '40px 22px 60px'
        }}
      >
        <div style={{ maxWidth: 1480, margin: '0 auto' }}>
          {/* Brand bar */}
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 28
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #00E5D4, #7B68EE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 700,
                color: '#020412',
                boxShadow: '0 0 18px rgba(0,229,212,.35)'
              }}
            >
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: '.18em'
                }}
              >
                MASTER OPERATIONS
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '.22em',
                  color: '#00E5D4',
                  opacity: 0.85
                }}
              >
                ACUTERIUM-INTERNAL // SOVEREIGN
              </span>
            </div>
          </header>

          {/* Phase banner */}
          <section
            style={{
              padding: '18px 22px',
              background: 'rgba(10,14,40,0.50)',
              border: '1px solid rgba(0,229,212,0.22)',
              borderRadius: 18,
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.05)',
              marginBottom: 22
            }}
          >
            <div
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              v1.4 · Phase 1A · Infrastructure Live
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'rgba(180,215,245,.78)',
                lineHeight: 1.6
              }}
            >
              PWA shell wired · service worker registered · sheets data plane gated by access-token
              middleware. Engine modules (12 doctrines · CWH gate · 5 cognitive engines · 6 KAIROS UI
              modes · hand-rolled SVG visualisations) land in subsequent sub-phases. Each milestone
              is verified before the next layer ships.
            </div>
          </section>

          {/* PWA status */}
          <section
            style={{
              padding: '16px 22px',
              background: 'rgba(10,14,40,0.50)',
              border: pwaError
                ? '1px solid rgba(255,59,48,0.30)'
                : pwaReady
                ? '1px solid rgba(48,209,88,0.30)'
                : '1px solid rgba(201,168,76,0.28)',
              borderRadius: 12,
              marginBottom: 22,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11
            }}
          >
            <div style={{ letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              PWA STATUS
            </div>
            {pwaError ? (
              <div style={{ color: '#FF3B30' }}>error · {pwaError}</div>
            ) : pwaReady ? (
              <div style={{ color: '#30D158' }}>
                ✓ service worker registered · installable from browser menu
              </div>
            ) : (
              <div style={{ color: '#C9A84C' }}>registering…</div>
            )}
          </section>

          {/* Data-plane sanity */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16
            }}
          >
            {(['matrix', 'tasks', 'milestones', 'kpis'] as const).map((tab) => (
              <div
                key={tab}
                style={{
                  padding: '20px 22px',
                  background: 'rgba(10,14,40,0.50)',
                  border: '1px solid rgba(0,229,212,0.22)',
                  borderRadius: 18,
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontWeight: 600,
                    fontSize: 34,
                    color: '#3DFFF5',
                    letterSpacing: '.04em',
                    lineHeight: 1
                  }}
                >
                  {counts[tab] == null ? '…' : counts[tab]}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '.18em',
                    color: 'rgba(130,175,215,.62)',
                    textTransform: 'uppercase',
                    marginTop: 6
                  }}
                >
                  {tab} rows
                </div>
              </div>
            ))}
          </section>

          {/* Footer attribution */}
          <footer
            style={{
              marginTop: 40,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '.22em',
              color: 'rgba(130,175,215,.52)',
              textTransform: 'uppercase'
            }}
          >
            Perplexity Commands · Claude Engineers · Cowork Coordinates · Sovereignty Delivers
          </footer>
        </div>
      </main>
    </>
  );
}
