interface Props {
  title: string;
  hint?: string;
  icon?: string;
}

export default function Empty({ title, hint, icon = '·' }: Props) {
  return (
    <div style={{
      padding: '60px 20px', textAlign: 'center',
      border: '1px dashed var(--border)', borderRadius: 16,
      color: 'var(--muted)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--border)' }}>{icon}</div>
      <p style={{ fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{title}</p>
      {hint && <p style={{ fontSize: 13 }}>{hint}</p>}
    </div>
  );
}
