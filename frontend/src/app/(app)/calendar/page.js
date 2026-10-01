'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { monthKey } from '../../../lib/format';
import { Icon } from '../../../lib/icons';
import { useToast } from '../../../components/Toast';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';
import Modal from '../../../components/Modal';

const EVENT_COLORS = ['accent', 'info', 'success', 'warning', 'danger'];

export default function CalendarPage() {
  const { toast } = useToast();
  const { t, lang } = useLang();
  const router = useRouter();
  const DOWS = t('calendar.dows');
  const [calDate, setCalDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', color: 'accent', type: '' });
  const [saving, setSaving] = useState(false);

  const key = monthKey(calDate);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/events?month=${key}`).then((d) => (Array.isArray(d) ? d : d?.events || [])).catch(() => []),
      api.get('/api/projects').then((d) => (Array.isArray(d) ? d : d?.projects || [])).catch(() => []),
      api.get('/api/tasks').then((d) => (Array.isArray(d) ? d : d?.tasks || [])).catch(() => []),
    ])
      .then(([ev, pr, tk]) => {
        setEvents(ev);
        setProjects(pr);
        setTasks(tk);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [key]);

  useRealtime(() => load(), [key]);

  const byDate = useMemo(() => {
    const map = {};
    const push = (d, item) => {
      if (!d) return;
      (map[d] = map[d] || []).push(item);
    };
    // Calendar events
    events.forEach((e) => push((e.date || '').slice(0, 10), { ...e, kind: 'event' }));
    // Active projects with a deadline
    projects
      .filter((p) => p.deadline && !['completed', 'archived'].includes(p.status))
      .forEach((p) => push(String(p.deadline).slice(0, 10), { kind: 'project', id: p.id, title: p.name }));
    // Tasks on their creation date (tasks have no due date)
    tasks.forEach((x) => push((x.created_at || '').slice(0, 10), { kind: 'task', id: x.id, title: x.title }));
    return map;
  }, [events, projects, tasks]);

  const cells = useMemo(() => {
    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const first = new Date(y, m, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();
    const today = new Date();
    const out = [];
    for (let i = startDow - 1; i >= 0; i--) out.push({ d: daysInPrev - i, other: true });
    for (let d = 1; d <= daysInMonth; d++) out.push({ d, other: false, date: new Date(y, m, d) });
    let next = 1;
    while (out.length % 7 !== 0 || out.length < 35) out.push({ d: next++, other: true });
    return out.map((c) => ({ ...c, isToday: c.date && c.date.toDateString() === today.toDateString() }));
  }, [calDate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createEvent = async () => {
    if (!form.title || !form.date) {
      toast(t('validation.required'), 'warn');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/events', form);
      toast(t('calendar.created'));
      setModalOpen(false);
      setForm({ title: '', date: '', time: '', color: 'accent', type: '' });
      load();
    } catch (e) {
      toast(e.message, 'warn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('calendar.title')}</h1>
          <p className="page-subtitle">{t('calendar.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" /> {t('calendar.newEvent')}
          </button>
        </div>
      </div>

      <div className="cal-toolbar">
        <h3 style={{ fontSize: '15px' }}>
          {calDate.toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => setCalDate(new Date())} title={t('common.today')}>
            <Icon name="calendar" />
          </button>
          <button
            className="icon-btn"
            onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
          >
            <Icon name="chevron" />
          </button>
          <button
            className="icon-btn"
            onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '12.5px' }} className="muted">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          {t('calendar.legendEvents')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
          {t('calendar.legendProjects')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }} />
          {t('calendar.legendTasks')}
        </span>
      </div>

      <div className="calendar-grid">
        {DOWS.map((d) => (
          <div className="cal-dow" key={d}>{d}</div>
        ))}
        {loading
          ? cells.map((c, i) => (
              <div className="cal-cell" key={i}>
                <div className="skel" style={{ height: 60 }} />
              </div>
            ))
          : cells.map((c, i) => {
              const dateKey = c.date
                ? `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}-${String(c.date.getDate()).padStart(2, '0')}`
                : '';
              const evs = byDate[dateKey] || [];
              return (
                <div className={`cal-cell ${c.other ? 'other-month' : ''} ${c.isToday ? 'today' : ''}`} key={i}>
                  <div className="cal-daynum">{c.d}</div>
                  {evs.map((it) => {
                    if (it.kind === 'project') {
                      return (
                        <div
                          key={`project-${it.id}`}
                          className="cal-event"
                          title={`${t('calendar.projectDeadline')}: ${it.title}`}
                          onClick={() => router.push(`/projects/${it.id}`)}
                          style={{ background: 'var(--danger-soft)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Icon name="projects" size={11} /> {it.title}
                        </div>
                      );
                    }
                    if (it.kind === 'task') {
                      return (
                        <div
                          key={`task-${it.id}`}
                          className="cal-event"
                          title={t('calendar.taskItem')}
                          style={{ background: 'var(--info-soft)', color: 'var(--info)' }}
                        >
                          {it.title}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`event-${it.id}`}
                        className="cal-event"
                        title={it.title}
                        style={{ background: `var(--${it.color || 'accent'}-soft)`, color: `var(--${it.color || 'accent'})` }}
                      >
                        {it.time ? <span className="num" style={{ fontWeight: 700 }}>{String(it.time).slice(0, 5)} </span> : null}{it.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('calendar.newEvent')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={createEvent} disabled={saving}>
              {saving ? t('common.saving') : t('common.create')}
            </button>
          </>
        }
      >
        <div className="field">
          <label>{t('calendar.title2')}</label>
          <input type="text" placeholder={t('calendar.titlePh')} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t('calendar.date')}</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('calendar.time')} ({t('common.optional')})</label>
            <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
        </div>
        <p className="muted" style={{ fontSize: '11.5px', marginTop: 4 }}>
          {t('calendar.timeHint')}
        </p>
        <div className="field-row">
          <div className="field">
            <label>{t('common.type')}</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="">{t('calendar.allDay')}</option>
              {['Shoot', 'Deadline', 'Review', 'Payment', 'Meeting'].map((ty) => (
                <option key={ty} value={ty}>{t(`calendar.eventTypes.${ty}`)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('calendar.color')}</label>
            <select value={form.color} onChange={(e) => set('color', e.target.value)}>
              {EVENT_COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
