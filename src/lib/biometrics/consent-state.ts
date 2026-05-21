/**
 * Three-tier consent state machine · Phase 3d-i.
 *
 *   OFF       → no storage entry
 *   SESSION   → sessionStorage entry · clears on tab close
 *   PERSISTENT → localStorage entry · survives reload
 *
 * Each channel (face2feel · voice2feel · touch2feel) has independent state.
 * No automatic upgrades — every transition requires explicit user action.
 * Default is OFF.
 *
 * Storage key conventions:
 *   localStorage["acu-master-ops:consent:v1"]                        = { [channel]: ConsentRecord }
 *   sessionStorage["acu-master-ops:consent:v1:<channel>"]            = ConsentRecord
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

import type { Channel, ConsentRecord, ConsentTier } from './face2feel-types';

export const CONSENT_STORAGE_KEY = 'acu-master-ops:consent:v1';

function sessionKey(channel: Channel): string {
  return `${CONSENT_STORAGE_KEY}:${channel}`;
}

function readLocalAll(): Record<string, ConsentRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ConsentRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalAll(records: Record<string, ConsentRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(records).length === 0) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(records));
    }
  } catch {
    /* quota / private-browsing — swallow */
  }
}

function readSession(channel: Channel): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(sessionKey(channel));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(channel: Channel, record: ConsentRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(sessionKey(channel), JSON.stringify(record));
  } catch {
    /* swallow */
  }
}

function clearSession(channel: Channel): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(sessionKey(channel));
  } catch {
    /* swallow */
  }
}

/**
 * Resolve the effective consent tier for a channel. Persistent > Session > Off.
 */
export function getEffectiveTier(channel: Channel): ConsentTier {
  if (typeof window === 'undefined') return 'off';
  const local = readLocalAll();
  if (local[channel]?.tier === 'persistent') return 'persistent';
  const sess = readSession(channel);
  if (sess?.tier === 'session') return 'session';
  return 'off';
}

/**
 * Save consent at the requested tier — clears the lower-priority storage
 * entry so the resolution order is deterministic.
 */
export function saveConsent(channel: Channel, tier: ConsentTier): void {
  if (typeof window === 'undefined') return;
  const record: ConsentRecord = {
    channel,
    tier,
    grantedAt: new Date().toISOString(),
    grantedVersion: 'v1',
  };

  if (tier === 'persistent') {
    const records = readLocalAll();
    records[channel] = record;
    writeLocalAll(records);
    clearSession(channel);
  } else if (tier === 'session') {
    const records = readLocalAll();
    delete records[channel];
    writeLocalAll(records);
    writeSession(channel, record);
  } else {
    /* 'off' clears both layers */
    const records = readLocalAll();
    delete records[channel];
    writeLocalAll(records);
    clearSession(channel);
  }
}
