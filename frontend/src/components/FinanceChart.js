'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  registerables,
} from 'chart.js';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n';

ChartJS.register(...registerables);

// Masculine Bright palette — Electric Blue / Cyan / Neon Green
export const chartTheme = {
  colors: {
    accent: '#0066FF',
    accentSoft: 'rgba(0,102,255,0.14)',
    cyan: '#00C2FF',
    cyanSoft: 'rgba(0,194,255,0.10)',
    indigo: '#4F46E5',
    indigoSoft: 'rgba(79,70,229,0.12)',
    success: '#22C55E',
    successSoft: 'rgba(34,197,94,0.08)',
    danger: '#F87171',
    dangerSoft: 'rgba(248,113,113,0.08)',
    warning: '#FACC15',
    info: '#00C2FF',
  },
  legendLabels: {
    color: '#8B94A3',
    usePointStyle: true,
    boxWidth: 7,
    font: { size: 11 },
  },
  tooltip: {
    backgroundColor: '#10182B',
    borderColor: '#1E2A45',
    borderWidth: 1,
    titleColor: '#F8FAFC',
    bodyColor: '#8B94A3',
  },
  gridColor: 'rgba(139,148,163,0.10)',
  tickColor: '#6B7280',
};

// Finance line chart fed by real database data via /api/dashboard/series.
// When there is no data it renders an honest empty state — never fake series.
export default function FinanceChart({ days = 30, revenue, expenses }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const { t } = useLang();
  const [series, setSeries] = useState(null);

  useEffect(() => {
    if (revenue && expenses) return; // caller-supplied data wins
    let alive = true;
    setSeries(null);
    api
      .get(`/api/dashboard/series?days=${days}`)
      .then((d) => alive && setSeries(d && Array.isArray(d.labels) ? d : null))
      .catch(() => alive && setSeries({ labels: [], revenue: [], expenses: [] }));
    return () => {
      alive = false;
    };
  }, [days, revenue, expenses]);

  const labels = revenue && expenses ? null : series?.labels || [];
  const rev = revenue && revenue.length ? revenue : series?.revenue || [];
  const exp = expenses && expenses.length ? expenses : series?.expenses || [];
  const hasData = rev.some((v) => v > 0) || exp.some((v) => v > 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasData) return;
    if (chartRef.current) chartRef.current.destroy();

    const profit = rev.map((r, i) => (r || 0) - (exp[i] || 0));

    chartRef.current = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t('analytics.revenue'),
            data: rev,
            borderColor: chartTheme.colors.accent,
            backgroundColor: chartTheme.colors.accentSoft,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2.2,
          },
          {
            label: t('analytics.expenses'),
            data: exp,
            borderColor: chartTheme.colors.danger,
            backgroundColor: chartTheme.colors.dangerSoft,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: t('analytics.profit'),
            data: profit,
            borderColor: chartTheme.colors.success,
            backgroundColor: chartTheme.colors.successSoft,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 700, easing: 'easeOutQuart' },
        plugins: {
          legend: { position: 'top', labels: chartTheme.legendLabels },
          tooltip: chartTheme.tooltip,
        },
        scales: {
          x: { grid: { color: chartTheme.gridColor }, ticks: { color: chartTheme.tickColor, font: { size: 10 } } },
          y: { grid: { color: chartTheme.gridColor }, ticks: { color: chartTheme.tickColor, font: { size: 10 } } },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, rev, exp, hasData, t]);

  if (series === null && !(revenue && expenses)) {
    return <div className="skel" style={{ height: 230 }} />;
  }

  if (!hasData) {
    return (
      <div className="muted" style={{ padding: '44px 20px', textAlign: 'center', fontSize: '13px' }}>
        {t('analytics.noDataText')}
      </div>
    );
  }

  return <canvas ref={canvasRef} height="230" />;
}
