/**
 * useConsent · Phase 3d-i.
 *
 * React hook for the three-tier consent state machine. SSR-safe — returns
 * `off` until the client mount effect reads storage. The grant/revoke
 * callbacks write through to the storage state machine and update local
 * React state in one step.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Channel, ConsentTier } from '../lib/biometrics/face2feel-types';
import { getEffectiveTier, saveConsent } from '../lib/biometrics/consent-state';

export interface UseConsentResult {
  tier: ConsentTier;
  grant: (tier: ConsentTier) => void;
  revoke: () => void;
  hydrated: boolean;
}

export function useConsent(channel: Channel): UseConsentResult {
  const [tier, setTier] = useState<ConsentTier>('off');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTier(getEffectiveTier(channel));
    setHydrated(true);
  }, [channel]);

  const grant = useCallback(
    (newTier: ConsentTier) => {
      saveConsent(channel, newTier);
      setTier(newTier);
    },
    [channel],
  );

  const revoke = useCallback(() => {
    saveConsent(channel, 'off');
    setTier('off');
  }, [channel]);

  return { tier, grant, revoke, hydrated };
}
