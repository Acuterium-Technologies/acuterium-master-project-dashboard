/**
 * Acuterium Master Operations Dashboard · v1.4 App() root.
 * Source: ACU-Master-Ops-Dashboard-v1.3.html lines 2743-2917 (verbatim port).
 *
 * Phase 1E wire-up: spawns the engine pipeline (NEXUS → PATHOS → KAIROS →
 * TELOS, with MNEMOS persistence), renders the 8 mode components, surfaces
 * the PathosSidebar / TelosPanel floats, and wires PWA install + offline +
 * service worker registration.
 *
 * Architectural invariant — section state and KAIROS mode state are
 * INDEPENDENT, ORTHOGONAL state machines:
 *   section ∈ {overview…doctrine}  — content layer (which mode component renders)
 *   mode    ∈ {aui…ambient}        — presentation layer (body.mode-X class)
 * A user on section='channels' can simultaneously be in mode='hud'.
 * The query-string ?section=X (from manifest shortcuts) sets section, not mode.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';

import {
  MNEMOS,
  MNEMOS_KEY,
  useNEXUS,
  computePATHOS,
  applyBreathing,
  PathosSidebar,
  useKAIROS,
  useTUUIRipples,
  showModeToast,
  computeTELOS,
  TelosPanel,
} from '../../../src/engines';
import type { MnemosProfile, KairosMode } from '../../../src/engines';
import {
  OverviewMode,
  CampaignMode,
  BuildMode,
  PortfolioMode,
  ChannelsMode,
  DecisionsPanel,
  MigrationMode,
  DoctrineMode,
} from '../../../src/components/modes';
import { HeroBrandLockup } from '../../../src/components/brand/HeroBrandLockup';
import { AcuteriumLogo } from '../../../src/components/brand/AcuteriumLogo';
import { usePersistedState } from '../../../src/lib/hooks/usePersistedState';
import { useParticles } from '../../../src/lib/hooks/useParticles';
import { useCWHTransition } from '../../../src/hooks/useCWHTransition';
import type { KairosModeApi, TransitionRequest } from '../../../src/lib/cwh/types';
import { computeComposite } from '../../../src/lib/doctrine-scoring';
import { META } from '../../../src/data/meta';
import type { ResidueVerdict } from '../../../src/data/types';

import '../../../src/styles/master-ops.css';

type SectionId =
  | 'overview'
  | 'campaign'
  | 'build'
  | 'portfolio'
  | 'channels'
  | 'decisions'
  | 'migration'
  | 'doctrine';

const SECTIONS: ReadonlyArray<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'campaign', label: 'CAMPAIGN' },
  { id: 'build', label: 'BUILD' },
  { id: 'portfolio', label: 'PORTFOLIO' },
  { id: 'channels', label: 'CHANNELS' },
  { id: 'decisions', label: 'DECISIONS' },
  { id: 'migration', label: 'MIGRATION' },
  { id: 'doctrine', label: 'DOCTRINE' },
];

const KAIROS_MODE_PILLS: ReadonlyArray<{ id: KairosMode; label: string; hint: string }> = [
  { id: 'aui', label: 'AUI', hint: 'glass' },
  { id: 'tuui', label: 'TUUI', hint: 'tactile' },
  { id: 'hud', label: 'HUD', hint: 'overlay' },
  { id: 'gui', label: 'GUI', hint: 'classic' },
  { id: 'dashboard', label: 'DASH', hint: 'dense' },
  { id: 'ambient', label: 'AMB', hint: 'organism' },
];

function isSectionId(v: string | null): v is SectionId {
  return v != null && SECTIONS.some((s) => s.id === v);
}

// Map engine-layer KairosMode (lowercase) → API contract (canonical case).
const KAIROS_MODE_TO_API: Record<KairosMode, KairosModeApi> = {
  aui: 'AUI',
  tuui: 'TUUI',
  hud: 'HUD',
  gui: 'GUI',
  dashboard: 'Dashboard',
  ambient: 'Ambient',
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function MasterOpsApp() {
  // Body class management — scope the page-level ACAI V2 styling.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('acu-master-ops');
    return () => {
      document.body.classList.remove('acu-master-ops');
    };
  }, []);

  // Particle canvas (lives at #bg-canvas).
  useParticles('bg-canvas');

  // Persisted state (tasks · milestones · OD closures · residue verdict).
  const persisted = usePersistedState();
  const {
    state,
    lastSaved,
    toggleTask,
    toggleMilestone,
    toggleOD,
    setResidue,
    resetAll,
  } = persisted;

  // Section state (content layer) — initial value from manifest ?section=X shortcuts.
  const searchParams = useSearchParams();
  const initialSection: SectionId = (() => {
    const q = searchParams?.get('section');
    return isSectionId(q) ? q : 'overview';
  })();
  const [section, setSection] = useState<SectionId>(initialSection);

  // ── LIVING-INTERFACE ENGINES (NEXUS → PATHOS → KAIROS → TELOS → MNEMOS) ──
  const [profile, setProfile] = useState<MnemosProfile>(() => MNEMOS.load());

  // bump session count once on mount
  useEffect(() => {
    setProfile((p) => {
      const np: MnemosProfile = { ...p, sessions: (p.sessions || 0) + 1 };
      MNEMOS.save(np);
      return np;
    });
  }, []);

  const nexus = useNEXUS(setProfile);
  const pathos = useMemo(
    () => computePATHOS({ nexus, profile, persisted: state }),
    [nexus, profile, state],
  );

  useEffect(() => {
    applyBreathing(pathos);
    setProfile((p) => {
      const np: MnemosProfile = { ...p, lastPathos: pathos };
      MNEMOS.save(np);
      return np;
    });
  }, [pathos]);

  const kairos = useKAIROS({ nexus, pathos, profile, setProfile });
  useTUUIRipples(kairos.mode);

  const predictions = useMemo(
    () =>
      computeTELOS({
        persisted: state,
        mode: kairos.mode,
        pathos,
        nexus,
      }),
    [state, kairos.mode, pathos, nexus],
  );

  // ── Phase 2: server-authority CWH gate via /api/cwh/transition ──
  // useCWHTransition keeps a synchronous client preview (UX speed) but
  // the server's verdict is final truth. On parity (preflight rule 7.15)
  // both verdicts always agree; the server adds the persisted auditId.
  const composite = useMemo(() => computeComposite(state), [state]);
  const composedDoctrineScore = composite.avg;
  const sessionId = profile.firstSeen || 'sess';

  const cwhSubmit = useCWHTransition({
    onTelemetry: (t) => {
      if (t.phase === 'denied' && t.server) {
        showModeToast('CWH SERVER DENY · ' + t.server.ruleId + ' · ' + (t.server.reason ?? ''));
      } else if (t.phase === 'rate_limited') {
        showModeToast('CWH RATE-LIMIT · slow down');
      } else if (t.phase === 'network_error') {
        showModeToast('CWH OFFLINE · client preview applied');
      }
    },
  });

  const buildRequest = useCallback(
    (
      target: TransitionRequest['target'],
      targetId: string,
      fromState: string,
      toState: string,
    ): TransitionRequest => ({
      target,
      targetId,
      fromState,
      toState,
      actor: {
        session: sessionId,
        pathos: {
          stress: pathos.stress,
          focus: pathos.focus,
          curiosity: pathos.curiosity,
          fatigue: pathos.fatigue,
          satisfaction: pathos.satisfaction,
        },
      },
      context: {
        kairosMode: KAIROS_MODE_TO_API[kairos.mode],
        doctrineScore: composedDoctrineScore,
      },
    }),
    [sessionId, pathos, kairos.mode, composedDoctrineScore],
  );

  const gatedToggleTask = useCallback(
    (id: string) => {
      const before = !!state.done[id];
      const input = buildRequest('task', id, before ? 'done' : 'open', before ? 'open' : 'done');
      const outcome = cwhSubmit.submit(input);
      // Optimistic apply when preview allows — reconcile on server response.
      Promise.resolve(outcome).then((o) => {
        if (o.allow) {
          toggleTask(id);
        } else {
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied'));
        }
      });
    },
    [state, toggleTask, buildRequest, cwhSubmit],
  );

  const gatedToggleMilestone = useCallback(
    (id: string) => {
      const before = !!state.closedMs[id];
      const input = buildRequest(
        'milestone',
        id,
        before ? 'closed' : 'open',
        before ? 'open' : 'closed',
      );
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (o.allow) {
          toggleMilestone(id);
        } else {
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied'));
        }
      });
    },
    [state, toggleMilestone, buildRequest, cwhSubmit],
  );

  const gatedToggleOD = useCallback(
    (id: string) => {
      const before = !!state.closedODs[id];
      const input = buildRequest(
        'od',
        id,
        before ? 'closed' : 'open',
        before ? 'open' : 'closed',
      );
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (o.allow) {
          toggleOD(id);
        } else {
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied'));
        }
      });
    },
    [state, toggleOD, buildRequest, cwhSubmit],
  );

  const gatedSetResidue = useCallback(
    (v: ResidueVerdict) => {
      const before = state.residueVerdict;
      if (before === v) return;
      const input = buildRequest('residue', 'CH-6', before, v);
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (o.allow) {
          setResidue(v);
        } else {
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied'));
        }
      });
    },
    [state, setResidue, buildRequest, cwhSubmit],
  );

  // ── PWA: install prompt · offline indicator · service worker register ──
  const [installPromptEvt, setInstallPromptEvt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(window.navigator.onLine);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallPromptEvt(null);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPromptEvt) return;
    await installPromptEvt.prompt();
    await installPromptEvt.userChoice;
    setInstallPromptEvt(null);
  }, [installPromptEvt]);

  // ── TELOS click router · '_mode:X' → KAIROS, else → section nav. ──
  const onTelosAction = useCallback(
    (action: string) => {
      if (action.startsWith('_mode:')) {
        const m = action.slice(6) as KairosMode;
        kairos.setMode(m);
      } else if (isSectionId(action)) {
        setSection(action);
      }
    },
    [kairos],
  );

  const sheetIdShort = META.sheetId.slice(0, 18);

  const handleReset = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('Reset all local progress + MNEMOS profile + audit log?')
    ) {
      resetAll();
      try {
        window.localStorage.removeItem(MNEMOS_KEY);
        window.localStorage.removeItem('acu-audit-log');
      } catch {
        /* ignore */
      }
      window.location.reload();
    }
  }, [resetAll]);

  return (
    <>
      {/* Sovereign font loader (self-hosted at /public/sovereign-fonts.css) */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sovereign-fonts.css" />

      <canvas id="bg-canvas" />
      <div id="consciousness-orb" />

      <nav className="bar">
        <div className="brand">
          <AcuteriumLogo size={40} />
          <div className="brand-text">
            <div className="brand-name">ACUTERIUM</div>
            <div className="brand-tag">MASTER OPS · ACAI V2 · LIVING</div>
          </div>
        </div>

        <div className="modes">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`mode-btn ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="spacer" />

        <div className="row" style={{ gap: 6 }}>
          {KAIROS_MODE_PILLS.map((km) => (
            <button
              key={km.id}
              className={`mode-btn ${kairos.mode === km.id ? 'active' : ''}`}
              title={`KAIROS → ${km.id.toUpperCase()} (${km.hint})`}
              onClick={() => kairos.setMode(km.id)}
            >
              {km.label}
            </button>
          ))}
          <span
            id="nexus-chip"
            title={`NEXUS · mouse ${nexus.mouseVel}px/s · scroll ${nexus.scrollVel}px/s · idle ${nexus.idleSeconds}s${nexus.hasTouch ? ' · touch' : ''}`}
          >
            <span className="dot" />
            NEXUS · {nexus.hasTouch ? 'touch' : 'mouse'} · {nexus.idleSeconds}s
          </span>
          {installPromptEvt && (
            <button
              className="btn pwa-install show"
              style={{ borderColor: 'var(--violet-qenc)', color: 'var(--violet-qenc)' }}
              onClick={installApp}
            >
              INSTALL
            </button>
          )}
          <span className={`chip ${isOnline ? 'green' : 'offline-chip'}`}>
            <span className="dot" />
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </span>
          {isInstalled && (
            <span
              className="chip"
              style={{
                background: 'rgba(123,104,238,.10)',
                borderColor: 'rgba(123,104,238,.30)',
                color: 'var(--violet-qenc)',
              }}
            >
              <span className="dot" style={{ background: 'var(--violet-qenc)' }} />
              PWA
            </span>
          )}
          <button className="btn" onClick={handleReset}>
            RESET
          </button>
        </div>
      </nav>

      <PathosSidebar pathos={pathos} />
      <TelosPanel predictions={predictions} onAction={onTelosAction} />

      <div className="shell">
        <HeroBrandLockup
          variant="compact"
          eyebrow="Acuterium Master Operations"
          title="Master Operations · Acuterium"
          subtitle={`${META.classification} · ${META.doctrine}`}
        />

        <div className="dep">
          <span className="chip green">
            <span className="dot" />
            LIVE
          </span>
          <span className="ok mono sm" style={{ fontWeight: 500 }}>
            master-project.acuterium.ai
          </span>
          <span className="muted sm">·</span>
          <span className="sm">Google Sheets backing</span>
          <code>{sheetIdShort}…</code>
          <span className="muted sm">·</span>
          <span className="sm">Sentry active</span>
          <span className="muted sm">·</span>
          <span className="sm">Vercel Analytics</span>
          <span className="muted sm">·</span>
          <span className="sm">30s sync</span>
          <span className="muted sm">·</span>
          <span className="mono xs" style={{ color: 'var(--violet-qenc)' }}>
            KAIROS: {kairos.mode.toUpperCase()}
            {kairos.autoSwitch ? ' · auto' : ' · manual'}
          </span>
          <span className="muted sm">·</span>
          <span className="mono xs" style={{ color: 'var(--gold-prime)' }}>
            DOCTRINE: {composite.avg}/100
          </span>
          <span className="right muted xs mono">
            last save ·{' '}
            {lastSaved
              ? new Date(lastSaved).toLocaleString('en-GB', { hour12: false })
              : 'never'}{' '}
            · session #{profile.sessions || 1}
          </span>
        </div>

        {section === 'overview' && (
          <OverviewMode state={state} toggleMilestone={gatedToggleMilestone} />
        )}
        {section === 'campaign' && (
          <CampaignMode state={state} toggleTask={gatedToggleTask} />
        )}
        {section === 'build' && (
          <BuildMode state={state} toggleTask={gatedToggleTask} />
        )}
        {section === 'portfolio' && <PortfolioMode />}
        {section === 'channels' && (
          <ChannelsMode state={state} setResidue={gatedSetResidue} />
        )}
        {section === 'decisions' && (
          <DecisionsPanel state={state} toggleOD={gatedToggleOD} />
        )}
        {section === 'migration' && <MigrationMode />}
        {section === 'doctrine' && <DoctrineMode state={state} />}

        <div className="divider" />
        <div
          className="row sm muted"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}
        >
          <span className="mono xs">
            Acuterium Technologies Inc. · Muscat, Sultanate of Oman ·{' '}
            {META.classification}
          </span>
          <span className="mono xs">
            {META.docVersion} · KAIROS·NEXUS·PATHOS·MNEMOS·TELOS · ASIP v2 ·
            ACT·INT·CON · {META.generated}
          </span>
        </div>
      </div>
    </>
  );
}

export default function MasterOpsPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <MasterOpsApp />
    </Suspense>
  );
}
