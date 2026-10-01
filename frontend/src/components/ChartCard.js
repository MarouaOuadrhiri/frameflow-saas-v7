export default function ChartCard({ title, children, action }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '14px', marginBottom: '14px' }}>{title}</h3>
      {children}
      {action}
    </div>
  );
}
