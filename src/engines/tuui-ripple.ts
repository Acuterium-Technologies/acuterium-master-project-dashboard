/**
 * TUUI ripple physics · Phase 3c.02.
 *
 * Replaces the legacy v1.3 inline pointerdown ripple in useTUUIRipples
 * with a single global listener pair (touchstart + click) that spawns
 * `.tuui-ripple` spans on any interactive surface inside body.mode-tuui.
 * Animation duration is 600 ms cubic-bezier (canon) — the ripple element
 * removes itself on `animationend` (no DOM leak, no setTimeout chase).
 *
 * Selector contract (matches the spec):
 *   .tuui-target · button · a · [role="button"]
 *
 * Listeners are attached once per browser session (idempotent guard).
 * Passive event mode — no scroll-blocking.
 *
 * Doctrinal red-lines:
 * - Reduced-motion: CSS @media zeroes the animation; spawn still happens
 *   (so the data marker [data-tuui-ripple-ready] stays present for the
 *   ACAI V2 conformance probe) but visually inert.
 * - Cleanup on `animationend` (no setTimeout) — no orphan elements.
 * - { passive: true } listeners — Lighthouse / scroll-jank safe.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

let attached = false;

const RIPPLE_SELECTOR = '.tuui-target, button, a, [role="button"]';
const READY_ATTR = 'data-tuui-ripple-ready';

function spawnRipple(target: HTMLElement, x: number, y: number): void {
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'tuui-ripple';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x - rect.left - size / 2}px`;
  ripple.style.top = `${y - rect.top - size / 2}px`;
  target.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  // Safety belt: if animationend never fires (e.g. reduced-motion + zero
  // animation), schedule a cleanup at 800 ms so we don't leak DOM nodes.
  window.setTimeout(() => {
    if (ripple.isConnected) ripple.remove();
  }, 800);
}

function findRippleTarget(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>(RIPPLE_SELECTOR);
}

function handleTouchStart(e: TouchEvent): void {
  if (!document.body.classList.contains('mode-tuui')) return;
  const touch = e.touches[0];
  if (!touch) return;
  const target = findRippleTarget(e.target);
  if (!target) return;
  spawnRipple(target, touch.clientX, touch.clientY);
}

function handleClick(e: MouseEvent): void {
  // Also fire on desktop click in TUUI mode — useful for the operator
  // testing TUUI behaviour on a laptop, and required for the Playwright
  // contract that synthesises a click after Alt+T.
  if (!document.body.classList.contains('mode-tuui')) return;
  const target = findRippleTarget(e.target);
  if (!target) return;
  spawnRipple(target, e.clientX, e.clientY);
}

/**
 * Idempotent — calling twice does NOT register duplicate listeners.
 * No-op on the server.
 */
export function attachTUUIRipples(): void {
  if (attached || typeof window === 'undefined') return;
  if (typeof document === 'undefined') return;
  attached = true;
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('click', handleClick, { passive: true });
  document.body.setAttribute(READY_ATTR, '1');
}

/** Test-only escape hatch. Not part of the production contract. */
export function __resetTUUIRipplesForTests(): void {
  if (typeof document !== 'undefined') {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('click', handleClick);
    document.body.removeAttribute(READY_ATTR);
  }
  attached = false;
}
