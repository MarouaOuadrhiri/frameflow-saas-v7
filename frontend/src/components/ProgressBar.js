export default function ProgressBar({ value = 0, tone = '', height }) {
  return (
    <div className="progress" style={height ? { height } : undefined}>
      <div className={`progress-bar ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}
