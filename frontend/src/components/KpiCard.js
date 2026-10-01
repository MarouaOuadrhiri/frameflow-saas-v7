import { Icon } from '../lib/icons';

export default function KpiCard({ icon, color = 'accent', label, value, change, up, sub }) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <div
          className="kpi-icon"
          style={{ background: `var(--${color}-soft)`, color: `var(--${color})` }}
        >
          <Icon name={icon} />
        </div>
        {change && (
          <span className={`kpi-change ${up ? 'up' : 'down'}`}>
            {up ? '▲' : '▼'} {change}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">
        {label} {sub && <span style={{ color: 'var(--text-faint)' }}> · {sub}</span>}
      </div>
    </div>
  );
}
