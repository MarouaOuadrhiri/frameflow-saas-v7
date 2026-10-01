'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { currency, shortDate, fullDate } from '../../../../lib/format';
import { Icon } from '../../../../lib/icons';
import Badge, { statusMeta } from '../../../../components/Badge';
import StatStrip from '../../../../components/StatStrip';
import ProgressBar from '../../../../components/ProgressBar';
import DataTable from '../../../../components/DataTable';
import EmptyState from '../../../../components/EmptyState';
import EquipPhoto from '../../../../components/EquipPhoto';
import ProjectMedia from '../../../../components/ProjectMedia';
import KanbanBoard from '../../../../components/KanbanBoard';
import Modal from '../../../../components/Modal';
import { useToast } from '../../../../components/Toast';
import { useLang } from '../../../../lib/i18n';
import { useRealtime } from '../../../../lib/realtime';
import { AddExpenseModal, AddPaymentModal } from '../../../../components/QuickAddModals';

const TABS = [
  { id: 'overview', labelKey: 'projectDetail.overview' },
  { id: 'production', labelKey: 'projectDetail.production' },
  { id: 'finances', labelKey: 'projectDetail.finances' },
  { id: 'equipment', labelKey: 'projectDetail.equipment' },
  { id: 'tasks', labelKey: 'projectDetail.tasks' },
  { id: 'media', labelKey: 'projectDetail.media' },
];

const PROJECT_STATUSES = [
  'planning',
  'pre-production',
  'production',
  'post-production',
  'review',
  'completed',
  'archived',
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'Normal' });
  const [savingTask, setSavingTask] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [selectedGearIds, setSelectedGearIds] = useState([]);
  const [gearSearch, setGearSearch] = useState('');
  const [gearMode, setGearMode] = useState('inventory');
  const [gearForm, setGearForm] = useState({ equipment_id: '', item_name: '', est_price: '' });
  const [savingGear, setSavingGear] = useState(false);
  const [togglingDone, setTogglingDone] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/projects/${params.id}`).then((d) => d?.project || d),
      api.get(`/api/projects/${params.id}/summary`).catch(() => null),
      api.get(`/api/tasks?project_id=${params.id}`).then((d) => (Array.isArray(d) ? d : d?.tasks || [])).catch(() => []),
      api.get(`/api/expenses?project_id=${params.id}`).then((d) => (Array.isArray(d) ? d : d?.expenses || [])).catch(() => []),
      api.get(`/api/payments?project_id=${params.id}`).then((d) => (Array.isArray(d) ? d : d?.payments || [])).catch(() => []),
      api.get('/api/equipment').then((d) => (Array.isArray(d) ? d : d?.equipment || [])).catch(() => []),
    ])
      .then(([p, s, t, e, pay, inv]) => {
        setProject(p);
        setSummary(s);
        setTasks(t);
        setExpenses(e);
        setPayments(pay);
        setInventory(inv);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Live: another admin on the same wifi changed something — reload this view.
  useRealtime(() => load(), [params.id]);

  const toggleDone = async () => {
    if (!project) return;
    setTogglingDone(true);
    try {
      const res = await api.post(`/api/projects/${project.id}/done`);
      const updated = res?.data || res;
      setProject(updated);
      toast(
        updated?.status === 'completed'
          ? (t('projectDetail.markedDone') || 'Project marked as completed')
          : (t('projectDetail.reopened') || 'Project reopened'),
        'check'
      );
      load();
    } catch (e) {
      toast(e.message || t('common.error'), 'warn');
    } finally {
      setTogglingDone(false);
    }
  };

  const assignGear = async () => {
    setSavingGear(true);
    try {
      if (gearMode === 'inventory') {
        if (selectedGearIds.length === 0) {
          toast(t('projectDetail.selectEquipment'), 'warn');
          return;
        }
        await api.post(`/api/projects/${project.id}/equipment`, { equipment_ids: selectedGearIds });
      } else {
        if (!gearForm.item_name.trim()) {
          toast(t('validation.required'), 'warn');
          return;
        }
        await api.post(`/api/projects/${project.id}/equipment`, {
          item_name: gearForm.item_name.trim(),
          est_price: Number(gearForm.est_price) || 0,
        });
      }
      toast(t('projectDetail.equipmentAssigned'));
      setModal(null);
      setSelectedGearIds([]);
      setGearSearch('');
      setGearForm({ equipment_id: '', item_name: '', est_price: '' });
      load();
    } catch (e) {
      toast(e.message, 'warn');
    } finally {
      setSavingGear(false);
    }
  };

  const removeGear = async (gearId) => {
    if (!confirm(t('projectDetail.removeGearConfirm'))) return;
    try {
      await api.del(`/api/projects/${project.id}/equipment/${gearId}`);
      toast(t('projectDetail.equipmentRemoved'));
      load();
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) {
      toast(t('projectDetail.giveTitle'), 'warn');
      return;
    }
    setSavingTask(true);
    try {
      await api.post('/api/tasks', {
        title: taskForm.title.trim(),
        project_id: project.id,
        priority: taskForm.priority,
        column: 'To Do',
      });
      toast(t('projectDetail.taskAdded'));
      setModal(null);
      setTaskForm({ title: '', priority: 'Normal' });
      const tsk = await api
        .get(`/api/tasks?project_id=${project.id}`)
        .then((d) => (Array.isArray(d) ? d : d?.tasks || []))
        .catch(() => []);
      setTasks(tsk);
    } catch (e) {
      toast(e.message, 'warn');
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="skel" style={{ height: 190, marginBottom: 22 }} />
        <div className="skel" style={{ height: 300 }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page">
        <EmptyState icon="projects" title={t('projectDetail.notFound')} text={t('projectDetail.notFoundText')} cta={t('projectDetail.backToProjects')} onCta={() => router.push('/projects')} />
      </div>
    );
  }

  const meta = (statusMeta(t) || {})[project.status] || { label: project.status, color: 'b-neutral' };
  // Finance numbers all come from /summary (budget, expensesTotal, paid, profit,
  // margin, remaining are computed consistently server-side). Never read the
  // raw `expenses`/`payments` row arrays as totals.
  const price = Number(summary?.budget ?? project.price ?? 0);
  const totalExpenses = Number(summary?.expensesTotal ?? 0);
  const paid = Number(summary?.paid ?? 0);
  const profit = Number(summary?.profit ?? price - totalExpenses);
  const margin = Number(summary?.margin ?? (price ? Math.round(((price - totalExpenses) / price) * 100) : 0));
  const remaining = Number(summary?.remaining ?? price - paid);
  const paidPct = price ? Math.round((paid / price) * 100) : 0;
  const equipment = summary?.equipment || [];

  return (
    <div className="page">
      <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={() => router.push('/projects')}>
        <Icon name="chevron" /> {t('projectDetail.backToProjects')}
      </button>

      <div className="detail-hero">
        <div className="detail-hero-content">
          <div>
            <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={project.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    setProject((prev) => ({ ...prev, status: newStatus }));
                    try {
                      await api.put(`/api/projects/${project.id}`, { status: newStatus });
                      toast(t('common.saved'), 'check');
                      load();
                    } catch (err) {
                      toast(err.message, 'warn');
                      load();
                    }
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  title={t('common.status')}
                >
                  {PROJECT_STATUSES.map((st) => (
                    <option key={st} value={st} style={{ background: '#10182b', color: '#f5f5f5' }}>
                      {statusMeta(t)[st]?.label || st}
                    </option>
                  ))}
                </select>
                <div style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Badge color={meta.color}>
                    {meta.label}
                    <span style={{ fontSize: '9px', marginLeft: 5, opacity: 0.8 }}>▼</span>
                  </Badge>
                </div>
              </div>
            </div>
            <div className="detail-hero-title">{project.name}</div>
            <div className="detail-hero-meta">
              <span><Icon name="clients" />{project.client_name || '—'}</span>
              <span><Icon name="projects" />{(() => { const k = `wizard.projectTypes.${project.type}`; const v = t(k); return project.type ? (v === k ? project.type : v) : '—'; })()}</span>
              <span><Icon name="calendar" />{fullDate(project.start_date)}</span>
              {project.deadline && project.deadline !== project.start_date && (
                <span><Icon name="calendar" />{t('wizard.deadline')}: {fullDate(project.deadline)}</span>
              )}
            </div>
          </div>
          <div className="page-actions">
            <button
              className={`btn ${project.status === 'completed' ? 'btn-success-soft' : 'btn-secondary'}`}
              onClick={toggleDone}
              disabled={togglingDone}
              title={project.status === 'completed' ? t('projectDetail.reopen') : t('projectDetail.markDone')}
            >
              <Icon name="check" />
              {project.status === 'completed' ? t('common.done') : t('projectDetail.markDone')}
            </button>
            <button
              className="btn btn-danger-ghost"
              onClick={async () => {
                if (!confirm(t('projectDetail.deleteConfirm', { name: project.name }))) return;
                try {
                  await api.del(`/api/projects/${project.id}`);
                  toast(t('projectDetail.deleted'));
                  router.push('/projects');
                } catch (e) {
                  toast(e.message, 'warn');
                }
              }}
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <StatStrip
            stats={[
              { label: t('projectDetail.budget'), value: currency(price) },
              { label: t('projectDetail.expenses'), value: currency(totalExpenses), tone: 'danger' },
              { label: t('projectDetail.profit'), value: currency(profit), tone: 'success' },
              { label: t('projectDetail.margin'), value: `${margin}%`, tone: 'accent' },
              { label: t('projectDetail.paid'), value: currency(paid) },
              { label: t('projectDetail.remaining'), value: currency(remaining) },
            ]}
          />
          <div className="two-col">
            <div>
              <div className="card" style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '14px' }}>{t('projectDetail.productionProgress')}</h3>
                  <span className="num" style={{ fontWeight: 600 }}>{project.progress || 0}%</span>
                </div>
                <ProgressBar value={project.progress || 0} height="8px" />
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: 12 }}>{t('projectDetail.upcomingTasks')}</h3>
              <div className="card">
                {tasks.slice(0, 3).map((t) => (
                  <div className="check-row" key={t.id}>
                    <div className={`checkbox ${(t.column || t.status) === 'Done' ? 'checked' : ''}`}>
                      {(t.column || t.status) === 'Done' && <Icon name="check" />}
                    </div>
                    <span>{t.title}</span>
                  </div>
                ))}
                {tasks.length === 0 && <div className="muted" style={{ fontSize: '12.5px' }}>{t('projectDetail.noTasks')}</div>}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'production' && (
        <div className="two-col">
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: 12 }}>{t('projectDetail.productionNotes')}</h3>
            <div className="card">
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {project.production_notes || project.description || t('projectDetail.noNotes')}
              </p>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: 12 }}>{t('projectDetail.location')}</h3>
            <div className="card" style={{ marginBottom: 22 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: 4 }}>{project.location || '—'}</div>
            </div>
            <h3 style={{ fontSize: '14px', marginBottom: 12 }}>{t('projectDetail.keyDates')}</h3>
            <div className="card">
              <div className="meta-row"><span className="muted">{t('projectDetail.startDate')}</span><span className="num">{fullDate(project.start_date)}</span></div>
              <div className="meta-row"><span className="muted">{t('wizard.deadline')}</span><span className="num">{fullDate(project.deadline)}</span></div>
              <div className="meta-row"><span className="muted">{t('common.status')}</span><Badge color={meta.color}>{meta.label}</Badge></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'finances' && (
        <>
          <StatStrip
            stats={[
              { label: t('projectDetail.totalPrice'), value: currency(price) },
              { label: t('projectDetail.totalExpenses'), value: currency(totalExpenses), tone: 'danger' },
              { label: t('projectDetail.totalPaid'), value: currency(paid) },
              { label: t('projectDetail.remaining'), value: currency(remaining) },
              { label: t('projectDetail.netProfit'), value: currency(profit), tone: 'success' },
              { label: t('projectDetail.margin'), value: `${margin}%`, tone: 'accent' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '14px' }}>{t('projectDetail.expenses')}</h3>
            <button className="btn btn-secondary" onClick={() => setModal('expense')}>
              <Icon name="plus" /> {t('projectDetail.addExpense')}
            </button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon="expense" title={t('projectDetail.noExpenses')} text={t('projectDetail.noExpensesText')} />
          ) : (
            <DataTable
              rowKey="id"
              columns={[
                { key: 'date', label: t('common.date'), render: (e) => <span className="num">{shortDate(e.date)}</span> },
                { key: 'description', label: t('common.description') },
                { key: 'category', label: t('projectDetail.category'), render: (e) => <Badge color="b-neutral">{e.category}</Badge> },
                { key: 'amount', label: t('common.amount'), render: (e) => <span className="num td-strong">{currency(e.amount)}</span> },
                { key: 'payment_method', label: t('projectDetail.method') },
              ]}
              rows={expenses}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '26px 0 12px' }}>
            <h3 style={{ fontSize: '14px' }}>{t('projectDetail.payment')}</h3>
            <button className="btn btn-secondary" onClick={() => setModal('payment')}>
              <Icon name="plus" /> {t('projectDetail.addPayment')}
            </button>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: '12.5px' }}>{t('projectDetail.paidOf', { paid: currency(paid), price: currency(price) })}</span>
              <span className="num" style={{ fontWeight: 600 }}>{paidPct}%</span>
            </div>
            <ProgressBar value={paidPct} tone="success" height="8px" />
            <div style={{ marginTop: 18 }}>
              {payments.map((p, i) => (
                <div className="timeline-item" key={p.id || i}>
                  <div className="timeline-dot-col">
                    <div className="timeline-dot" style={{ background: 'var(--success)' }} />
                    {i < payments.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{p.description || t('projectDetail.payment')} — {currency(p.amount)}</div>
                    <div className="timeline-sub">{p.method} · {shortDate(p.date)} · <Badge color="b-success">{t('projectDetail.paid')}</Badge></div>
                  </div>
                </div>
              ))}
              {remaining > 0 && (
                <div className="timeline-item">
                  <div className="timeline-dot-col"><div className="timeline-dot" /></div>
                  <div className="timeline-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div className="timeline-title">{t('projectDetail.finalPayment')} — {currency(remaining)}</div>
                      <div className="timeline-sub"><Badge color="b-warning">{t('projectDetail.pending')}</Badge></div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setModal('payment')}>
                      <Icon name="plus" size={12} /> {t('projectDetail.addPayment')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'equipment' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '14px' }}>{t('projectDetail.assignedEquipment', { n: equipment.length })}</h3>
            <button className="btn btn-primary" onClick={() => setModal('gear')}>
              <Icon name="plus" /> {t('projectDetail.assignEquipment')}
            </button>
          </div>
          {equipment.length === 0 ? (
            <EmptyState icon="equipment" title={t('projectDetail.noEquipment')} text={t('projectDetail.noEquipmentText')} cta={t('projectDetail.assignEquipment')} onCta={() => setModal('gear')} />
          ) : (
            <div className="equip-grid">
              {equipment.map((e) => {
                const isDamaged = Number(e.equip_damaged) === 1;
                return (
                  <div className={`equip-card${isDamaged ? ' damaged' : ''}`} key={e.id} style={{ position: 'relative' }}>
                    <button
                      className="icon-btn"
                      onClick={() => removeGear(e.id)}
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: 'rgba(10,14,24,0.7)' }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                    <div className="equip-thumb"><EquipPhoto photo={e.equip_photo} alt={e.item_name} /></div>
                    <div className="equip-name">{e.item_name}</div>
                    <div className="equip-brand">{[e.equip_brand, e.equip_category].filter(Boolean).join(' · ') || '—'}</div>
                    <div className="equip-foot">
                      {isDamaged && <Badge color="b-danger">{t('equipment.damagedBadge')}</Badge>}
                      <span className="equip-price">{Number(e.est_price) > 0 ? currency(e.est_price) : (e.equip_price != null ? currency(e.equip_price) : '')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'tasks' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '14px' }}>{t('projectDetail.tasksForProject', { n: tasks.length })}</h3>
            <button className="btn btn-primary" onClick={() => setModal('task')}>
              <Icon name="plus" /> {t('projectDetail.newTask')}
            </button>
          </div>
          <KanbanBoard tasks={tasks} onChange={setTasks} />
        </>
      )}

      {tab === 'media' && <ProjectMedia projectId={params.id} />}

      <AddExpenseModal open={modal === 'expense'} onClose={() => { setModal(null); load(); }} projectId={project.id} />
      <AddPaymentModal open={modal === 'payment'} onClose={() => { setModal(null); load(); }} projectId={project.id} defaultAmount={remaining} />
      <Modal
        open={modal === 'task'}
        onClose={() => setModal(null)}
        title={`${t('projectDetail.newTask')} — ${project.name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={createTask} disabled={savingTask}>
              {savingTask ? t('common.saving') : t('projectDetail.newTask')}
            </button>
          </>
        }
      >
        <div className="field">
          <label>{t('projectDetail.taskTitle')}</label>
          <input
            type="text"
            placeholder={t('projectDetail.taskTitlePh')}
            value={taskForm.title}
            onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>{t('common.priority')}</label>
          <select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}>
            {['Normal', 'High', 'Urgent'].map((p) => (
              <option key={p} value={p}>{p === 'Normal' ? t('common.normal') : p === 'High' ? t('common.high') : t('common.urgent')}</option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        open={modal === 'gear'}
        onClose={() => setModal(null)}
        title={t('projectDetail.assignEquipmentTitle')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={assignGear} disabled={savingGear}>
              {savingGear ? t('common.saving') : t('projectDetail.assign')}
            </button>
          </>
        }
      >
        <div className="field">
          <label>{t('projectDetail.gearSource')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'inventory', label: t('projectDetail.fromInventory') },
              { id: 'custom', label: t('projectDetail.customItem') },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setGearMode(o.id)}
                className={`btn ${gearMode === o.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {gearMode === 'inventory' ? (
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>{t('projectDetail.selectEquipment')}</label>
              <span className="muted" style={{ fontSize: '12px' }}>
                {selectedGearIds.length} {t('equipment.items')}
              </span>
            </div>
            <div className="gear-picker-wrap">
              <div className="gear-picker-toolbar">
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={gearSearch}
                  onChange={(e) => setGearSearch(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '12.5px' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '11.5px' }}
                    onClick={() => {
                      const unassigned = inventory
                        .filter((inv) => !equipment.some((eq) => eq.equipment_id === inv.id))
                        .map((inv) => inv.id);
                      setSelectedGearIds(unassigned.length ? unassigned : inventory.map((inv) => inv.id));
                    }}
                  >
                    {t('common.all')}
                  </button>
                  {selectedGearIds.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      onClick={() => setSelectedGearIds([])}
                    >
                      {t('common.none')}
                    </button>
                  )}
                </div>
              </div>

              <div className="gear-picker-list">
                {inventory
                  .filter((inv) => {
                    if (!gearSearch.trim()) return true;
                    const q = gearSearch.toLowerCase();
                    return (
                      inv.name?.toLowerCase().includes(q) ||
                      inv.brand?.toLowerCase().includes(q) ||
                      inv.category?.toLowerCase().includes(q)
                    );
                  })
                  .map((inv) => {
                    const isSelected = selectedGearIds.includes(inv.id);
                    const isAlreadyAssigned = equipment.some((eq) => eq.equipment_id === inv.id);
                    return (
                      <div
                        key={inv.id}
                        className={`gear-picker-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedGearIds((cur) =>
                            cur.includes(inv.id) ? cur.filter((id) => id !== inv.id) : [...cur, inv.id]
                          );
                        }}
                      >
                        <div className="gear-picker-checkbox">
                          {isSelected && <Icon name="check" size={12} />}
                        </div>
                        <div className="gear-picker-thumb">
                          <EquipPhoto photo={inv.photo} alt={inv.name} />
                        </div>
                        <div className="gear-picker-info">
                          <div className="gear-picker-name">
                            {inv.name}
                            {isAlreadyAssigned && (
                              <span className="muted" style={{ fontSize: '11px', marginLeft: 6 }}>
                                · (Assigned)
                              </span>
                            )}
                          </div>
                          <div className="gear-picker-meta">
                            {[inv.brand, inv.category].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </div>
                        {inv.price != null && (
                          <div className="gear-picker-price">{currency(inv.price)}</div>
                        )}
                      </div>
                    );
                  })}
                {inventory.length === 0 && (
                  <div className="muted" style={{ padding: '16px', textAlign: 'center', fontSize: '12.5px' }}>
                    {t('projectDetail.noEquipment')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="field">
              <label>{t('projectDetail.itemName')}</label>
              <input
                type="text"
                placeholder={t('projectDetail.itemNamePh')}
                value={gearForm.item_name}
                onChange={(e) => setGearForm((f) => ({ ...f, item_name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>{t('projectDetail.estPrice')}</label>
              <input
                type="number"
                min="0"
                value={gearForm.est_price}
                onChange={(e) => setGearForm((f) => ({ ...f, est_price: e.target.value }))}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
