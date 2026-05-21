export default function Loading() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#030509',
        color: 'rgba(230,245,255,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '.22em',
        textTransform: 'uppercase'
      }}
    >
      Loading master operations…
    </main>
  );
}
