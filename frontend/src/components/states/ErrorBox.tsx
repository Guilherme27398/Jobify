interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBox({ message, onRetry }: Props) {
  return (
    <div role="alert" style={{
      padding: '16px 20px', borderRadius: 12,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#f87171', fontSize: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠</span>
        <span>{message}</span>
      </span>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'rgba(239,68,68,0.15)',
          color: '#fca5a5',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer',
        }}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}
