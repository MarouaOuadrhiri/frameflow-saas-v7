import { initials } from '../lib/format';

export default function Avatar({ name = '', size = '', online = false, onClick, style }) {
  return (
    <div
      className={`avatar ${size}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer', ...(style || {}) } : style}
    >
      {initials(name)}
      {online && <span className="status-dot" />}
    </div>
  );
}
