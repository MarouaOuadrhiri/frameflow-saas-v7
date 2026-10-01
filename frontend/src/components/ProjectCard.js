'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '../lib/icons';
import { currency } from '../lib/format';
import { useLang } from '../lib/i18n';
import Badge, { statusMeta } from './Badge';
import ProgressBar from './ProgressBar';

// NOTE: project cards intentionally have no cover/banner — the studio has no
// photos for projects, so cards use a clean, text-led layout instead of a
// colored placeholder area. No deadline is shown: projects run open-ended.

export default function ProjectCard({ project }) {
  const router = useRouter();
  const { t } = useLang();
  const meta = statusMeta(t)[project.status] || { label: project.status, color: 'b-neutral' };
  const expensesTotal = Number(project.expenses_total ?? project.expenses ?? 0);
  const profit = (project.price || project.budget || 0) - expensesTotal;

  return (
    <div className="pcard" onClick={() => router.push(`/projects/${project.id}`)}>
      <div className="pcard-body">
        <div className="pcard-top">
          <Badge color={meta.color}>{meta.label}</Badge>
          <span className="pcard-type muted">{(() => { const k = `wizard.projectTypes.${project.type}`; const v = t(k); return project.type ? (v === k ? project.type : v) : ''; })()}</span>
        </div>
        <div className="pcard-title">{project.name}</div>
        <div className="pcard-client">{project.client_name || '—'}</div>
        <div className="pcard-stats">
          <div>
            <div className="pcard-stat-label">{t('projects.budget')}</div>
            <div className="pcard-stat-value">{currency(project.price || project.budget)}</div>
          </div>
          <div>
            <div className="pcard-stat-label">{t('projects.expenses')}</div>
            <div className="pcard-stat-value" style={{ color: 'var(--danger)' }}>
              {currency(expensesTotal)}
            </div>
          </div>
          <div>
            <div className="pcard-stat-label">{t('projects.profit')}</div>
            <div className="pcard-stat-value" style={{ color: 'var(--success)' }}>
              {currency(profit)}
            </div>
          </div>
        </div>
        <div className="pcard-foot">
          <div className="pcard-progress-wrap">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10.5px',
                color: 'var(--text-faint)',
                marginBottom: '4px',
              }}
            >
              <span>{t('projects.progress')}</span>
              <span>{project.progress || 0}%</span>
            </div>
            <ProgressBar value={project.progress || 0} />
          </div>
        </div>
        <div className="pcard-foot" style={{ marginTop: '12px', justifyContent: 'flex-end' }}>
          <div className="equipcount">
            <Icon name="equipment" /> {project.equip_count ?? project.equipCount ?? 0} {t('equipment.items')}
          </div>
        </div>
      </div>
    </div>
  );
}
