'use client';

type Props = { savedAt: Date | null };

export function Header({ savedAt }: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: '2px solid var(--ink)',
      gap: 16,
      flexWrap: 'wrap'
    }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
          ACUTERIUM-INTERNAL · SOVEREIGN
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5 }}>
          Master Project Dashboard
        </div>
        <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 2 }}>
          Acuterium portfolio coordination platform · Stage Two
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600 }}>● LIVE · GOOGLE SHEETS BACKED</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
          {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : 'Auto-refresh every 30s'}
        </div>
      </div>
    </div>
  );
}
