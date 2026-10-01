export default function StatStrip({ stats = [], cols }) {
  return (
    <div className={`stat-strip${cols ? ` cols-${cols}` : ''}`}>
      {stats.map((s, i) => (
        <div className="stat-cell" key={i}>
          <div className="stat-cell-label">{s.label}</div>
          <div className={`stat-cell-value ${s.tone || ''}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
