import { Icon } from '../lib/icons';

// Localized status metadata: pass the i18n `t` function.
export function statusMeta(t) {
  return {
    planning: { label: t('statuses.planning'), color: 'b-info' },
    'pre-production': { label: t('statuses.preProduction'), color: 'b-info' },
    production: { label: t('statuses.production'), color: 'b-accent' },
    'post-production': { label: t('statuses.postProduction'), color: 'b-warning' },
    review: { label: t('statuses.review'), color: 'b-warning' },
    completed: { label: t('statuses.completed'), color: 'b-success' },
    archived: { label: t('statuses.archived'), color: 'b-neutral' },
  };
}

export default function Badge({ color = 'b-neutral', icon, children }) {
  return (
    <span className={`badge ${color}`}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}
