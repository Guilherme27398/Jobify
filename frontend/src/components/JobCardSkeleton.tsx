export default function JobCardSkeleton() {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: '75%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '50%' }} />
        </div>
        <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 20, width: 55, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ height: 14, width: 80, marginTop: 4 }} />
    </div>
  );
}
