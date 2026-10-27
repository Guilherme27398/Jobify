interface Props {
  label?: string;
  /** Size in px */
  size?: number;
  /** If true, renders inline (no padding, no vertical layout) */
  inline?: boolean;
}

export default function Loading({ label = 'A carregar…', size = 24, inline = false }: Props) {
  const spinner = (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.08)`,
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
    }} />
  );

  if (inline) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
        {spinner}
        {label && <span>{label}</span>}
      </span>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 14, padding: '60px 20px',
      color: 'var(--muted)', fontSize: 13,
    }}>
      {spinner}
      {label && <p>{label}</p>}
    </div>
  );
}
