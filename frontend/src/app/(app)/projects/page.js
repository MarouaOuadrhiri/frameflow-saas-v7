'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { currency } from '../../../lib/format';
import { Icon } from '../../../lib/icons';
import ProjectCard from '../../../components/ProjectCard';
import Badge, { statusMeta } from '../../../components/Badge';
import ProgressBar from '../../../components/ProgressBar';
import EmptyState from '../../../components/EmptyState';
import DataTable from '../../../components/DataTable';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';

const FILTERS = ['all', 'planning', 'pre-production', 'production', 'post-production', 'review', 'completed', 'archived'];
const KANBAN_COLS = ['planning', 'production', 'post-production', 'completed'];

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const { t } = useLang();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');

  const load = () => {
    setLoading(true);
    api
      .get('/api/projects')
      .then((d) => setProjects(Array.isArray(d) ? d : d?.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  const list = useMemo(
    () =>
      projects.filter((p) => {
        const okFilter = filter === 'all' || p.status === filter;
        const okSearch =
          !search ||
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.client_name?.toLowerCase().includes(search.toLowerCase());
        return okFilter && okSearch;
      }),
    [projects, filter, search]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('projects.title')}</h1>
          <p className="page-subtitle">{t('projects.subtitle')}</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            {[
              { id: 'grid', labelKey: 'projects.grid', icon: 'dashboard' },
              { id: 'list', labelKey: 'projects.list', icon: 'tasks' },
              { id: 'kanban', labelKey: 'projects.kanban', icon: 'analytics' },
            ].map((v) => (
              <button key={v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>
                <Icon name={v.icon} />
                {t(v.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-chip-row">
        {FILTERS.map((c) => (
          <button key={c} className={`chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c === 'all' ? t('projects.allStatuses') : statusMeta(t)[c]?.label || c}
          </button>
        ))}
      </div>

      {loading && (
        <div className="projects-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 250 }} />
          ))}
        </div>
      )}

      {!loading && list.length === 0 && (
        <EmptyState
          icon="projects"
          title={t('projects.noProjects')}
          text={t('projects.noProjectsText')}
        />
      )}

      {!loading && list.length > 0 && view === 'grid' && (
        <div className="projects-grid">
          {list.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}

      {!loading && list.length > 0 && view === 'list' && (
        <DataTable
          rowKey="id"
          onRowClick={(p) => router.push(`/projects/${p.id}`)}
          columns={[
            { key: 'name', label: t('projects.project'), strong: true },
            { key: 'client_name', label: t('projects.client') },
            {
              key: 'status',
              label: t('common.status'),
              render: (p) => {
                const m = statusMeta(t)[p.status] || { label: p.status, color: 'b-neutral' };
                return <Badge color={m.color}>{m.label}</Badge>;
              },
            },
            { key: 'price', label: t('projects.budget'), render: (p) => <span className="num">{currency(p.price)}</span> },
            {
              key: 'profit',
              label: t('projects.profit'),
              render: (p) => (
                <span className="num" style={{ color: 'var(--success)' }}>
                  {currency((p.price || 0) - (p.expenses_total || 0))}
                </span>
              ),
            },
            {
              key: 'progress',
              label: t('projects.progress'),
              render: (p) => (
                <div style={{ width: 120 }}>
                  <ProgressBar value={p.progress || 0} />
                </div>
              ),
            },
          ]}
          rows={list}
        />
      )}

      {!loading && list.length > 0 && view === 'kanban' && (
        <div className="kanban">
          {KANBAN_COLS.map((col) => {
            const items = list.filter(
              (p) => p.status === col || (col === 'planning' && p.status === 'pre-production')
            );
            return (
              <div className="kanban-col" key={col}>
                <div className="kanban-col-head">
                  <span className="kanban-col-title">{statusMeta(t)[col]?.label}</span>
                  <span className="kanban-col-count">{items.length}</span>
                </div>
                <div className="kanban-cards">
                  {items.map((p) => (
                    <div className="task-card" key={p.id} onClick={() => router.push(`/projects/${p.id}`)}>
                      <div className="task-card-title">{p.name}</div>
                      <div className="task-card-foot">
                        <span className="muted" style={{ fontSize: '11px' }}>{p.client_name}</span>
                        <Badge color="b-neutral">{currency((p.price || 0) - (p.expenses_total || 0))}</Badge>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="kanban-empty">{t('projectDetail.nothingHere')}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
