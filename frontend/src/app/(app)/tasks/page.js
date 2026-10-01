'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Icon } from '../../../lib/icons';
import { useToast } from '../../../components/Toast';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';
import Modal from '../../../components/Modal';
import EmptyState from '../../../components/EmptyState';
import KanbanBoard from '../../../components/KanbanBoard';

const COLS = ['To Do', 'In Progress', 'Review', 'Done'];

export default function TasksPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', project_id: '', priority: 'Normal', column: 'To Do' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/tasks').then((d) => (Array.isArray(d) ? d : d?.tasks || [])).catch(() => []),
      api.get('/api/projects').then((d) => (Array.isArray(d) ? d : d?.projects || [])).catch(() => []),
    ])
      .then(([t, p]) => {
        setTasks(t);
        setProjects(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post('/api/tasks', { ...form, title: form.title.trim() });
      toast(t('tasks.created'));
      setModalOpen(false);
      setForm({ title: '', project_id: '', priority: 'Normal', column: 'To Do' });
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
          <h1 className="page-title">{t('tasks.title')}</h1>
          <p className="page-subtitle">{t('tasks.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" /> {t('tasks.newTask')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="kanban">
          {COLS.map((c) => (
            <div key={c} className="skel" style={{ height: 280 }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="tasks" title={t('tasks.noTasks')} text={t('tasks.noTasksText')} cta={t('tasks.newTask')} onCta={() => setModalOpen(true)} />
      ) : (
        <>
          <p className="muted" style={{ fontSize: '12px', marginBottom: 10 }}>{t('tasks.moveHint')}</p>
          <KanbanBoard tasks={tasks} onChange={setTasks} showProject projects={projects} />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('tasks.newTask')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={create} disabled={saving}>
              {saving ? t('common.saving') : t('common.create')}
            </button>
          </>
        }
      >
        <div className="field">
          <label>{t('tasks.title2')}</label>
          <input type="text" placeholder={t('tasks.titlePh')} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t('tasks.project')}</label>
            <select value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
              <option value="">{t('tasks.noProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('tasks.priority')}</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {['Normal', 'High', 'Urgent'].map((p) => (
                <option key={p} value={p}>{p === 'Normal' ? t('common.normal') : p === 'High' ? t('common.high') : t('common.urgent')}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
