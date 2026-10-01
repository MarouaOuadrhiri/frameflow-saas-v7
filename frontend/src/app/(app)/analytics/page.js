'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  registerables,
} from 'chart.js';
import { Bar, Doughnut, PolarArea } from 'react-chartjs-2';
import { api } from '../../../lib/api';
import { currency } from '../../../lib/format';
import KpiCard from '../../../components/KpiCard';
import ChartCard from '../../../components/ChartCard';
import { chartTheme } from '../../../components/FinanceChart';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';

ChartJS.register(...registerables);

const legend = { position: 'top', labels: { color: '#8B94A3', boxWidth: 7, font: { size: 11 } } };
const legendRight = { position: 'right', labels: { color: '#8B94A3', boxWidth: 8, font: { size: 10.5 } } };
const axisTick = { color: '#6B7280', font: { size: 10 } };

const CAT_COLORS = ['#0066FF', '#00C2FF', '#4F46E5', '#22C55E', '#FACC15', '#8B94A3', '#F87171'];
const TYPE_COLORS = ['#0066FF99', '#00C2FF99', '#4F46E599', '#22C55E99', '#FACC1599', '#F8717199', '#8B94A399'];

function NoData({ t }) {
  return (
    <div className="muted" style={{ padding: '44px 20px', textAlign: 'center', fontSize: '13px' }}>
      {t('analytics.noDataText')}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('6m');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/dashboard').catch(() => null),
      api.get('/api/projects').then((d) => (Array.isArray(d) ? d : d?.projects || [])).catch(() => []),
    ])
      .then(([dash, projs]) => {
        setData(dash);
        setProjects(projs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  const kpis = data?.kpis || {};

  const months = useMemo(() => {
    let m = data?.monthly || [];
    if (range === '1y') m = m.slice(-12);
    else m = m.slice(-6);
    return m;
  }, [data, range]);

  const labels = months.map((m) => m.label || m.month);
  const rev = months.map((m) => m.revenue || 0);
  const exp = months.map((m) => m.expenses || 0);
  const prof = months.map((m) => m.profit ?? (m.revenue || 0) - (m.expenses || 0));
  const hasMonthly = rev.some((v) => v > 0) || exp.some((v) => v > 0);

  const expenseCats = useMemo(() => {
    const map = {};
    (data?.expensesByCategory || []).forEach((c) => {
      const label = c.category || c.label;
      if (label) map[label] = (map[label] || 0) + (c.total || c.value || 0);
    });
    return map;
  }, [data]);
  const catLabels = Object.keys(expenseCats).map((c) => {
    const k = `quickAdd.expenseCats.${c}`;
    const v = t(k);
    return v === k ? c : v;
  });
  const catValues = Object.values(expenseCats);
  const hasCats = catValues.some((v) => v > 0);

  const typeCounts = {};
  projects.forEach((p) => {
    typeCounts[p.type || t('quickAdd.expenseCats.Other')] = (typeCounts[p.type || t('quickAdd.expenseCats.Other')] || 0) + 1;
  });
  const hasTypes = Object.values(typeCounts).some((v) => v > 0);

  const profitProjects = projects.slice(0, 12);
  const profitVals = profitProjects.map((p) => (p.price || 0) - (p.expenses_total || 0));
  const hasProfit = profitProjects.length > 0 && profitVals.some((v) => v !== 0);

  if (loading) {
    return (
      <div className="page">
        <div className="grid kpi-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 128 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('analytics.title')}</h1>
          <p className="page-subtitle">{t('analytics.subtitle')}</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            {['6m', '1y', 'All'].map((r) => (
              <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
                {r === '6m' ? t('analytics.range6m') : r === '1y' ? t('analytics.range1y') : t('analytics.rangeAll')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid kpi-grid" style={{ marginBottom: 30 }}>
        <KpiCard icon="revenue" color="success" label={t('analytics.totalRevenue')} value={currency(kpis.totalRevenue)} />
        <KpiCard icon="expense" color="danger" label={t('analytics.totalExpenses')} value={currency(kpis.totalExpenses)} />
        <KpiCard icon="profit" color="success" label={t('analytics.netProfit')} value={currency(kpis.netProfit)} />
        <KpiCard icon="projects" color="accent" label={t('analytics.activeProjects')} value={kpis.activeProjects ?? '—'} />
        <KpiCard icon="margin" color="info" label={t('analytics.profitMargin')} value={`${kpis.margin ?? '—'}%`} />
        <KpiCard icon="equipment" color="warning" label={t('analytics.equipmentValue')} value={currency(kpis.equipmentValue)} />
      </div>

      <div className="two-col">
        <ChartCard title={t('analytics.revenueVsExpenses')}>
          {hasMonthly ? (
            <Bar
              height={230}
              data={{
                labels,
                datasets: [
                  { label: t('analytics.revenue'), data: rev, backgroundColor: chartTheme.colors.accent, borderRadius: 4 },
                  { label: t('analytics.expenses'), data: exp, backgroundColor: chartTheme.colors.danger, borderRadius: 4 },
                  { label: t('analytics.profit'), data: prof, backgroundColor: chartTheme.colors.success, borderRadius: 4 },
                ],
              }}
              options={{
                animation: { duration: 700, easing: 'easeOutQuart' },
                plugins: { legend, tooltip: chartTheme.tooltip },
                scales: {
                  x: { grid: { display: false }, ticks: axisTick },
                  y: { grid: { color: chartTheme.gridColor }, ticks: axisTick },
                },
              }}
            />
          ) : (
            <NoData t={t} />
          )}
        </ChartCard>
        <ChartCard title={t('analytics.expensesByCategory')}>
          {hasCats ? (
            <Doughnut
              height={230}
              data={{
                labels: catLabels,
                datasets: [
                  {
                    data: catValues,
                    backgroundColor: CAT_COLORS,
                    borderColor: '#0B1220',
                    borderWidth: 2,
                  },
                ],
              }}
              options={{ animation: { duration: 700, easing: 'easeOutQuart' }, plugins: { legend: legendRight, tooltip: chartTheme.tooltip } }}
            />
          ) : (
            <NoData t={t} />
          )}
        </ChartCard>
      </div>

      <div className="two-col" style={{ marginTop: 18 }}>
        <ChartCard title={t('analytics.profitByProject')}>
          {hasProfit ? (
            <Bar
              height={230}
              data={{
                labels: profitProjects.map((p) => p.name),
                datasets: [
                  {
                    label: t('analytics.profit'),
                    data: profitVals,
                    backgroundColor: chartTheme.colors.success,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                indexAxis: 'y',
                animation: { duration: 700, easing: 'easeOutQuart' },
                plugins: { legend: { display: false }, tooltip: chartTheme.tooltip },
                scales: {
                  x: { grid: { color: chartTheme.gridColor }, ticks: axisTick },
                  y: { grid: { display: false }, ticks: { color: '#8B94A3', font: { size: 10.5 } } },
                },
              }}
            />
          ) : (
            <NoData t={t} />
          )}
        </ChartCard>
        <ChartCard title={t('analytics.projectsByType')}>
          {hasTypes ? (
            <PolarArea
              height={230}
              data={{
                labels: Object.keys(typeCounts),
                datasets: [{ data: Object.values(typeCounts), backgroundColor: TYPE_COLORS }],
              }}
              options={{
                animation: { duration: 700, easing: 'easeOutQuart' },
                plugins: { legend: legendRight, tooltip: chartTheme.tooltip },
                scales: { r: { grid: { color: chartTheme.gridColor }, ticks: { display: false } } },
              }}
            />
          ) : (
            <NoData t={t} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
