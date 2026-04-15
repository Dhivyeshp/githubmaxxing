export default function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
      }}
    >
      {children}
    </p>
  );
}
