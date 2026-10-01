'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { currency, longDate, shortDate } from '../../../lib/format';
import { Icon } from '../../../lib/icons';
import KpiCard from '../../../components/KpiCard';
import ProjectCard from '../../../components/ProjectCard';
import FinanceChart from '../../../components/FinanceChart';
import { useAuth } from '../../../lib/auth';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';

const RANGES = [
  { labelKey: 'dashboard.last7', days: 7 },
  { labelKey: 'dashboard.last30', days: 30 },
  { labelKey: 'dashboard.last3m', days: 90 },
  { labelKey: 'dashboard.last6m', days: 180 },
  { labelKey: 'dashboard.last1y', days: 365 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(30);

  const load = () => {
    setLoading(true);
    api
      .get('/api/dashboard')
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Live: refresh when a teammate on the same wifi changes anything.
  useRealtime(() => load(), []);

  const firstName = (user?.name || '').split(' ')[0] || 'there';
  const kpis = data?.kpis || {};
  const netProfitNum = Number(kpis.netProfit ?? 0);
  const activeProjects = data?.activeProjects || data?.projects || [];
  const alerts = data?.smartAlerts || data?.alerts || [];
  const damagedEquipment = data?.damagedEquipment || { count: 0, items: [] };
  const timeline = data?.timeline || [];

  const kpiCards = [
    { icon: 'projects', color: 'accent', label: t('dashboard.activeProjects'), value: kpis.activeProjects ?? '—' },
    { icon: 'revenue', color: 'success', label: t('dashboard.totalRevenue'), value: currency(kpis.totalRevenue) },
    { icon: 'expense', color: 'danger', label: t('dashboard.totalExpenses'), value: currency(kpis.totalExpenses) },
    { icon: netProfitNum < 0 ? 'warn' : 'profit', color: netProfitNum < 0 ? 'danger' : 'success', label: t('dashboard.netProfit'), value: currency(kpis.netProfit) },
    { icon: 'margin', color: 'info', label: t('dashboard.profitMargin'), value: `${kpis.margin ?? '—'}%` },
    {
      icon: 'equipment',
      color: 'warning',
      label: t('dashboard.equipmentValue'),
      value: currency(kpis.equipmentValue),
      sub: `${kpis.equipmentCount ?? ''} ${t('equipment.items')}`,
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="grid kpi-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 128 }} />
          ))}
        </div>
        <div className="skel" style={{ height: 260, marginTop: 24 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-title">{error}</div>
          <button className="btn btn-secondary" onClick={load} style={{ marginTop: 12 }}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title')} <span className="live-badge"><span className="live-dot" />{t('dashboard.live')}</span></h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/analytics">
            <Icon name="analytics" /> {t('nav.analytics')}
          </Link>
        </div>
      </div>

      <div className="grid kpi-grid">
        {kpiCards.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      <div className="section-title-row">
        <h2>{t('dashboard.activeProjectsList')}</h2>
        <Link className="link-more" href="/projects">
          {t('common.viewAll')} <Icon name="chevronRight" />
        </Link>
      </div>
      <div className="projects-grid">
        {activeProjects.slice(0, 3).map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
      {activeProjects.length === 0 && <div className="muted" style={{ fontSize: '13px' }}>{t('dashboard.noActiveProjects')}</div>}

      <div className="two-col" style={{ marginTop: 34 }}>
        <div>
          <div className="section-title-row" style={{ marginTop: 0 }}>
            <h2>{t('dashboard.financeOverview')}</h2>
            <div className="view-toggle">
              {RANGES.map((r) => (
                <button key={r.days} className={range === r.days ? 'active' : ''} onClick={() => setRange(r.days)}>
                  {t(r.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <FinanceChart days={range} />
          </div>

          <div className="section-title-row">
            <h2>{t('dashboard.timeline')}</h2>
          </div>
          <div className="card">
            {timeline.length === 0 && <div className="muted" style={{ fontSize: '12.5px' }}>{t('dashboard.noEvents')}</div>}
            {timeline.map((t, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-dot-col">
                  <div className="timeline-dot" />
                  {i < timeline.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{t.title}</div>
                  <div className="timeline-sub">
                    {t.date ? shortDate(t.date) : ''}
                    {t.project_name ? ` · ${t.project_name}` : ''}
                    {t.kind ? ` · ${t.kind}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="section-title-row" style={{ marginTop: 0 }}>
            <h2>{t('dashboard.smartAlerts')}</h2>
          </div>
          {alerts.length === 0 && (
            <div className="alert-item">
              <div className="alert-ic" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                <Icon name="check" />
              </div>
              <div className="alert-text">{t('dashboard.noAlerts')}</div>
            </div>
          )}
          {alerts.map((a, i) => (
            <div className="alert-item" key={i}>
              <div className="alert-ic" style={{ background: `var(--${a.color}-soft)`, color: `var(--${a.color})` }}>
                <Icon name={a.icon} />
              </div>
              <div className="alert-text">
                <span dangerouslySetInnerHTML={{ __html: a.text }} />
                <div className="alert-time">{a.time}</div>
              </div>
            </div>
          ))}

          <div className="section-title-row">
            <h2>{t('dashboard.damagedEquipment')}</h2>
            <Link href="/equipment" style={{ fontSize: '12px' }}>{t('common.viewAll')}</Link>
          </div>
          <div className="card">
            {damagedEquipment.count === 0 && (
              <div className="muted" style={{ fontSize: '12.5px' }}>{t('dashboard.noDamaged')}</div>
            )}
            {damagedEquipment.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-soft)',
                }}
              >
                <span style={{ fontSize: '13px' }}>{item.name}</span>
                <span className="badge b-danger">{t('equipment.damagedBadge')}</span>
              </div>
            ))}
            {damagedEquipment.count > damagedEquipment.items.length && (
              <div className="muted" style={{ fontSize: '12px', marginTop: 8 }}>
                +{damagedEquipment.count - damagedEquipment.items.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
