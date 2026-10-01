import { Icon } from '../lib/icons';

export default function EmptyState({ icon = 'projects', title, text, cta, onCta }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} />
      </div>
      <div className="empty-title">{title}</div>
      <div className="empty-text">{text}</div>
      {cta && (
        <button className="btn btn-primary" onClick={onCta}>
          <Icon name="plus" />
          {cta}
        </button>
      )}
    </div>
  );
}
