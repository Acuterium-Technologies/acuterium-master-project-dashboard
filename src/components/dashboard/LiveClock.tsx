/**
 * LiveClock · footer real-time date+time, updating every second.
 *
 * Renders an empty placeholder on the server + first client paint (so there is
 * no hydration mismatch), then ticks live once mounted. Replaces the frozen
 * build-time META.generated stamp in the footer.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
'use client';

import { useEffect, useState } from 'react';

export function LiveClock() {
  const [text, setText] = useState('');

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    setText(fmt());
    const t = window.setInterval(() => setText(fmt()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return <span suppressHydrationWarning>{text || '—'}</span>;
}
