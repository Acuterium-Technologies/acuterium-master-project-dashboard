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
import { ulid } from 'ulid';

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
import { useChronos } from '../../../src/engines/chronos';
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
  ReportsMode,
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

// Phase 3b · Dashboard-mode BI grid + write-back drawer
import { BIGrid } from '../../../src/components/dashboard/BIGrid';
import { ChronosLabel } from '../../../src/components/dashboard/ChronosLabel';
import { LiveClock } from '../../../src/components/dashboard/LiveClock';
import { EditDrawer } from '../../../src/components/dashboard/EditDrawer';
import { MOEMatrixFull } from '../../../src/components/dashboard/MOEMatrixFull';
import { SPEC_BY_TARGET, type UpdateTarget } from '../../../src/lib/dashboard/edit-specs';

// Phase 3d-i · Face2Feel sensor channel
import { SentinelDot } from '../../../src/components/biometrics/SentinelDot';
import { useFace2Feel } from '../../../src/hooks/useFace2Feel';

import '../../../src/styles/master-ops.css';
import '../../../src/styles/bi-grid.css';
import '../../../src/styles/edit-drawer.css';
import '../../../src/styles/biometrics.css';

type SectionId =
  | 'overview'
  | 'campaign'
  | 'build'
  | 'portfolio'
  | 'channels'
  | 'decisions'
  | 'migration'
  | 'doctrine'
  | 'reports';

const SECTIONS: ReadonlyArray<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'campaign', label: 'CAMPAIGN' },
  { id: 'build', label: 'BUILD' },
  { id: 'portfolio', label: 'PORTFOLIO' },
  { id: 'channels', label: 'CHANNELS' },
  { id: 'decisions', label: 'DECISIONS' },
  { id: 'migration', label: 'MIGRATION' },
  { id: 'doctrine', label: 'DOCTRINE' },
  { id: 'reports', label: 'REPORTS' },
];

const KAIROS_MODE_PILLS: ReadonlyArray<{ id: KairosMode; label: string; hint: string }> = [
  { id: 'aui', label: 'AUI', hint: 'glass' },
  { id: 'tuui', label: 'TUUI', hint: 'tactile' },
  { id: 'hud', label: 'HUD', hint: 'overlay' },
  { id: 'gui', label: 'GUI', hint: 'classic' },
  { id: 'dashboard', label: 'DASH', hint: 'dense' },
  { id: 'ambient', label: 'AMB', hint: 'organism' },
];

// Phase 3c.04 · canonical 3-word hero stagger (cold-load reveal).
const HERO_STAGGER_WORDS = ['MASTER', 'OPERATIONS', 'ACUTERIUM'] as const;

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

  // Phase 3c.01 · CHRONOS temporal adaptation — sets --chronos-gradient
  // on documentElement and re-evaluates every 10 minutes. GCC locales
  // (ar-OM/SA/AE/QA/BH) get the 6 prayer-time periods; others get the
  // 6 standard time-of-day periods. The hook returns state for downstream
  // labels (TopStrip) and the body background reads the CSS variable.
  useChronos();

  // Particle canvas (lives at #bg-canvas) · Phase 3c.03 reads KAIROS mode
  // for density variance + 200 hard cap. The hook bootstraps from 'aui' and
  // the mode-change effect below repaints particles in place when KAIROS
  // resolves the persisted dominantMode.

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

  // Phase 3c.05 · ?dashboard=moe swaps the Dashboard-mode center canvas
  // for the full MOE Expert Activation Matrix renderer (F-13 cleanup).
  const showMOEFull = searchParams?.get('dashboard') === 'moe';

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

  // Phase 3c.03 · particle density reads KAIROS mode for per-mode multipliers
  // (Ambient 3× · HUD 0.3× · etc.) with the 200 hard cap.
  useParticles('bg-canvas', kairos.mode);

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

  // Phase 3d-i · Face2Feel sensor channel (default consent OFF).
  // Hook is consent-gated internally — getUserMedia + worker spawn only fire
  // when the user has explicitly chosen Session or Persistent.
  const face2feel = useFace2Feel();

  // ── Phase 3b · expose engines to window.__acai for conformance matrix ──
  // Phase 3d-i adds the face2feel branch with status/isActive/lastPathosDelta/
  // lastConfidence/revoke per spec 06.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    type AcaiWindow = Window & { __acai?: Record<string, unknown> };
    const w = window as AcaiWindow;
    w.__acai = {
      kairos: { mode: kairos.mode, autoSwitch: kairos.autoSwitch },
      pathos,
      nexus,
      telos: { predictions },
      face2feel: {
        status: face2feel.tier,
        isActive: face2feel.isActive,
        lastPathosDelta: face2feel.lastDelta,
        lastConfidence: face2feel.lastConfidence,
        revoke: face2feel.revoke,
      },
    };
    return () => {
      try {
        delete (w as AcaiWindow).__acai;
      } catch {
        /* ignore */
      }
    };
  }, [
    kairos.mode,
    kairos.autoSwitch,
    pathos,
    nexus,
    predictions,
    face2feel.tier,
    face2feel.isActive,
    face2feel.lastDelta,
    face2feel.lastConfidence,
    face2feel.revoke,
  ]);

  // Phase 3d-i · Sentinel state derivation — keeps the doctrinal guarantee
  // that the red dot is visible whenever the camera channel is live, with
  // an amber pause when the tab is hidden.
  const [sentinelState, setSentinelState] = useState<'inactive' | 'active' | 'paused'>('inactive');
  useEffect(() => {
    if (!face2feel.isActive) {
      setSentinelState('inactive');
      return;
    }
    const compute = () => {
      if (typeof document === 'undefined') return 'active' as const;
      return document.visibilityState === 'hidden' ? ('paused' as const) : ('active' as const);
    };
    setSentinelState(compute());
    if (typeof document === 'undefined') return;
    const onVis = () => setSentinelState(compute());
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [face2feel.isActive]);

  // ── Phase 3b · write-back drawer state ─────────────────────────────────
  type DraftEdit = {
    target: UpdateTarget;
    targetId: string;
    row: Record<string, string | boolean | number | null | undefined>;
  };
  const [draftEdit, setDraftEdit] = useState<DraftEdit | null>(null);

  const openEditDrawer = useCallback(
    (
      target: UpdateTarget,
      targetId: string,
      row: Record<string, string | boolean | number | null | undefined>,
    ) => {
      setDraftEdit({ target, targetId, row });
    },
    [],
  );

  // Expose the drawer opener so mode components (or DevTools for smoke
  // testing) can invoke it without prop-drilling through 5 layers.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    type AcaiOpener = Window & {
      openEditDrawer?: typeof openEditDrawer;
    };
    (window as AcaiOpener).openEditDrawer = openEditDrawer;
    return () => {
      try {
        delete (window as AcaiOpener).openEditDrawer;
      } catch {
        /* ignore */
      }
    };
  }, [openEditDrawer]);

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

  // ── Phase 3a.06 · Sheets write-back for the gated toggles ───────────────
  // The four toggles below previously only called /api/cwh/transition and the
  // local toggle, so (A) lastSaved stayed null whenever the CWH server was
  // unreachable, and (B) Google Sheets was never written for checkbox state.
  // persistToSheets reuses the proven /api/sheets/update endpoint (same payload
  // the EditDrawer uses) to actually push the change to the canonical sheet.
  // Local save is authoritative (local-first sovereignty): a Sheets failure is
  // surfaced as a soft toast but does NOT revert the operator's local change —
  // only a CWH governance DENY reverts it.
  const persistToSheets = useCallback(
    (
      target: 'task-update' | 'milestone-update',
      targetId: string,
      field: string,
      newValue: string,
    ) => {
      fetch('/api/sheets/update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          targetId,
          field,
          newValue,
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
          idempotencyKey: ulid(),
        }),
      })
        .then(async (r) => {
          if (!r.ok) {
            const j = (await r.json().catch(() => ({}))) as { reason?: string; error?: string };
            showModeToast(
              'Sheets persist failed · ' + (j.reason ?? j.error ?? r.status) + ' · local saved',
            );
          }
        })
        .catch(() => showModeToast('Sheets persist offline · local saved'));
    },
    [sessionId, pathos, kairos.mode, composedDoctrineScore],
  );

  const gatedToggleTask = useCallback(
    (id: string) => {
      const before = !!state.done[id];
      // 1. LOCAL-FIRST — apply + persist locally immediately so lastSaved always
      //    reflects the latest attempt, even if the CWH server is unreachable.
      toggleTask(id);
      // 2. SERVER GATE — reconcile against the authoritative CWH verdict.
      const input = buildRequest('task', id, before ? 'done' : 'open', before ? 'open' : 'done');
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (!o.allow) {
          toggleTask(id); // revert local change on governance deny
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied') + ' · reverted');
          return;
        }
        // 3. SHEETS PERSIST — Tasks tab, `done` column (TRUE/FALSE booleans).
        persistToSheets('task-update', id, 'done', before ? 'FALSE' : 'TRUE');
      });
    },
    [state, toggleTask, buildRequest, cwhSubmit, persistToSheets],
  );

  const gatedToggleMilestone = useCallback(
    (id: string) => {
      const before = !!state.closedMs[id];
      toggleMilestone(id);
      const input = buildRequest(
        'milestone',
        id,
        before ? 'closed' : 'open',
        before ? 'open' : 'closed',
      );
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (!o.allow) {
          toggleMilestone(id);
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied') + ' · reverted');
          return;
        }
        // Milestones tab uses a `closed` boolean column (TRUE/FALSE).
        persistToSheets('milestone-update', id, 'closed', before ? 'FALSE' : 'TRUE');
      });
    },
    [state, toggleMilestone, buildRequest, cwhSubmit, persistToSheets],
  );

  const gatedToggleOD = useCallback(
    (id: string) => {
      const before = !!state.closedODs[id];
      toggleOD(id);
      const input = buildRequest(
        'od',
        id,
        before ? 'closed' : 'open',
        before ? 'open' : 'closed',
      );
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (!o.allow) {
          toggleOD(id);
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied') + ' · reverted');
        }
        // Owner-decision closures are local-first only: the backing sheet has
        // no `decisions` tab yet (schema follow-up). CWH still gates + audits.
      });
    },
    [state, toggleOD, buildRequest, cwhSubmit],
  );

  const gatedSetResidue = useCallback(
    (v: ResidueVerdict) => {
      const before = state.residueVerdict;
      if (before === v) return;
      setResidue(v);
      const input = buildRequest('residue', 'CH-6', before, v);
      Promise.resolve(cwhSubmit.submit(input)).then((o) => {
        if (!o.allow) {
          setResidue(before);
          showModeToast('CWH GATE · ' + (o.reason ?? 'denied') + ' · reverted');
        }
        // Residue verdict is local-first only: no `channels` tab in the sheet
        // yet (schema follow-up). CWH still gates + audits the transition.
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

  // Section content rendered the same way in both shell and dashboard layout.
  const sectionContent = (
    <>
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
      {section === 'reports' && <ReportsMode />}
    </>
  );

  const isDashboard = kairos.mode === 'dashboard';

  return (
    <>
      {/* Sovereign font loader (self-hosted at /public/sovereign-fonts.css) */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sovereign-fonts.css" />

      <canvas id="bg-canvas" />
      <div id="consciousness-orb" />

      {/* Phase 3d-i · cam-active screen indicator · z-index 99999 · above all chrome */}
      <SentinelDot channel="face2feel" state={sentinelState} />

      {!isDashboard && (
        <>
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
              title={`KAIROS → ${km.id.toUpperCase()} (${km.hint}) · pins this view`}
              onClick={() => kairos.setMode(km.id)}
            >
              {km.label}
            </button>
          ))}
          {/* AUTO toggle · when ON, NEXUS may auto-switch the view; when OFF the
              selected mode is pinned. Picking any mode pill above also pins. */}
          <button
            className={`mode-btn ${kairos.autoSwitch ? 'active' : ''}`}
            title={
              kairos.autoSwitch
                ? 'KAIROS auto-switch ON — NEXUS may change the view. Click to pin the current mode.'
                : `KAIROS pinned to ${kairos.mode.toUpperCase()}. Click to re-enable auto-switch.`
            }
            onClick={() => kairos.setAutoSwitch(!kairos.autoSwitch)}
          >
            {kairos.autoSwitch ? 'AUTO' : 'PINNED'}
          </button>
          <ChronosLabel variant="compact" />
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
          staggerWords={HERO_STAGGER_WORDS}
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

        {sectionContent}

        <div className="divider" />
        <div
          className="row sm muted"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}
        >
          <span className="mono xs">
            Acuterium Technologies Inc. ·{' '}
            {`${META.classification} // Genesis Through Intelligence`}
          </span>
          <span className="mono xs">
            {META.docVersion} · KAIROS·NEXUS·PATHOS·MNEMOS·TELOS · ASIP v2 ·
            ACT·INT·CON · <LiveClock />
          </span>
        </div>
      </div>
        </>
      )}

      {isDashboard && (
        <BIGrid
          mode={kairos.mode}
          pathos={pathos}
          kairosLabel={kairos.mode}
          profile={profile}
          nexus={nexus}
          predictions={predictions}
          onTelosAction={onTelosAction}
          onModeChange={(m) => kairos.setMode(m as KairosMode)}
          onSectionChange={(s) => isSectionId(s) && setSection(s)}
          currentSection={section}
        >
          {showMOEFull ? <MOEMatrixFull /> : sectionContent}
        </BIGrid>
      )}

      {draftEdit && (
        <EditDrawer
          open={true}
          target={draftEdit.target}
          targetId={draftEdit.targetId}
          row={draftEdit.row}
          fieldSpec={SPEC_BY_TARGET[draftEdit.target]}
          actorSession={sessionId}
          pathos={pathos}
          kairosMode={kairos.mode}
          doctrineScore={composedDoctrineScore}
          onClose={() => setDraftEdit(null)}
        />
      )}
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
