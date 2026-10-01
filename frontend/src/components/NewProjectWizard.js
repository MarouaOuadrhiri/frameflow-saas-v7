'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { currency } from '../lib/format';
import { Icon } from '../lib/icons';
import { useLang } from '../lib/i18n';
import { useToast } from './Toast';
import Modal from './Modal';

import EquipPhoto from './EquipPhoto';

const PROJECT_TYPES = ['Wedding Film', 'Music Video', 'Commercial', 'Fashion Editorial', 'Corporate Event', 'Social / Reels'];

export default function NewProjectWizard({ open, onClose }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const STEPS = [t('wizard.steps.0'), t('wizard.steps.1'), t('wizard.steps.2'), t('wizard.steps.3'), t('wizard.steps.4')];
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [equipSearch, setEquipSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    client_id: '',
    type: PROJECT_TYPES[0],
    description: '',
    location: '',
    start_date: '',
    duration: 'long',
    deadline: '',
    price: '',
    budget: '',
    deposit: '',
    estimated_expenses: '',
    equipment_ids: [],
    tasks: [''],
  });

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setEquipSearch('');
    setForm({
      name: '',
      client_id: '',
      type: PROJECT_TYPES[0],
      description: '',
      location: '',
      start_date: '',
      duration: 'long',
      deadline: '',
      price: '',
      budget: '',
      deposit: '',
      estimated_expenses: '',
      equipment_ids: [],
      tasks: [''],
    });
    api.get('/api/clients').then((d) => setClients(Array.isArray(d) ? d : d?.clients || [])).catch(() => {});
    api.get('/api/equipment').then((d) => setEquipment(Array.isArray(d) ? d : d?.equipment || [])).catch(() => {});
  }, [open ]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const price = +form.price || +form.budget || 0;
  const deposit = +form.deposit || 0;
  const expenses = +form.estimated_expenses || 0;
  const remaining = Math.max(0, price - deposit);
  const profit = price - expenses;
  const margin = price > 0 ? Math.round(((price - expenses) / price) * 100) : 0;

  const toggleMulti = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const setTaskAt = (i, value) =>
    setForm((f) => {
      const tasks = [...f.tasks];
      tasks[i] = value;
      return { ...f, tasks };
    });

  const addTaskRow = () => setForm((f) => ({ ...f, tasks: [...f.tasks, ''] }));
  const removeTaskRow = (i) =>
    setForm((f) => ({ ...f, tasks: f.tasks.length > 1 ? f.tasks.filter((_, x) => x !== i) : [''] }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast(t('wizard.nameRequired'), 'warn');
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const cleanTasks = form.tasks.map((x) => x.trim()).filter(Boolean).map((title) => ({ title, priority: 'Normal' }));
      const isOneDay = form.duration === 'one';
      const startDate = form.start_date || null;
      await api.post('/api/projects', {
        name: form.name.trim(),
        client_id: form.client_id || null,
        type: form.type,
        description: form.description,
        location: form.location,
        start_date: startDate,
        deadline: isOneDay ? startDate : form.deadline || null,
        price: price || null,
        budget: +form.budget || price || null,
        deposit: deposit || null,
        estimated_expenses: expenses || null,
        equipment_ids: form.equipment_ids,
        production_notes: form.production_notes || null,
        tasks: cleanTasks,
      });
      toast(t('wizard.created'));
      onClose();
      router.push('/projects');
      router.refresh();
    } catch (e) {
      toast(e.message || t('wizard.createFailed'), 'warn');
    } finally {
      setSaving(false);
    }
  };

  const go = (dir) => {
    if (step === STEPS.length - 1 && dir === 1) {
      submit();
      return;
    }
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + dir)));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('wizard.title')}
      wide
      footer={
        <>
          <button
            className="btn btn-secondary"
            onClick={() => go(-1)}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            {t('wizard.back')}
          </button>
          <button className="btn btn-primary" onClick={() => go(1)} disabled={saving}>
            {saving ? t('common.saving') : step === STEPS.length - 1 ? t('wizard.createProject') : t('wizard.continue')}
          </button>
        </>
      }
    >
      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className={`wizard-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="wizard-step-num">{i < step ? '✓' : i + 1}</div>
              <div className="wizard-step-label">{s}</div>
            </div>
            {i < STEPS.length - 1 && <div className="wizard-connector" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="field">
            <label>{t('wizard.projectName')}</label>
            <input type="text" placeholder={t('wizard.projectNamePh')} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t('wizard.client')}</label>
              <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
                <option value="">{t('wizard.selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('wizard.projectType')}</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {PROJECT_TYPES.map((pt) => {
                  const k = `wizard.projectTypes.${pt}`;
                  const v = t(k);
                  return <option key={pt} value={pt}>{v === k ? pt : v}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="field">
            <label>{t('wizard.description')}</label>
            <textarea placeholder={t('wizard.descriptionPh')} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t('wizard.location')}</label>
              <input type="text" placeholder={t('wizard.locationPh')} value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div className="field">
              <label>{t('wizard.duration')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'one', label: t('wizard.oneDay') },
                  { id: 'long', label: t('wizard.longDuration') },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => set('duration', o.id)}
                    className={`btn ${form.duration === o.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px 6px', fontSize: '12.5px' }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {form.duration === 'one' ? (
            <div className="field">
              <label>{t('wizard.shootDate')}</label>
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
          ) : (
            <div className="field-row">
              <div className="field">
                <label>{t('wizard.startDate')}</label>
                <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('wizard.deadline')} ({t('common.optional')})</label>
                <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
              </div>
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <div className="field-row">
            <div className="field">
              <label>{t('wizard.clientPrice')}</label>
              <input
                type="number"
                placeholder="12000"
                value={form.price}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((f) => ({
                    ...f,
                    price: val,
                    budget: !f.budget || f.budget === f.price ? val : f.budget,
                  }));
                }}
              />
            </div>
            <div className="field">
              <label>{t('wizard.estimatedBudget')}</label>
              <input
                type="number"
                placeholder="11000"
                value={form.budget}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((f) => ({
                    ...f,
                    budget: val,
                    price: !f.price ? val : f.price,
                  }));
                }}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t('wizard.deposit')}</label>
              <input type="number" placeholder="3600" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
            </div>
            <div className="field">
              <label>{t('wizard.estimatedExpenses')}</label>
              <input type="number" placeholder="7200" value={form.estimated_expenses} onChange={(e) => set('estimated_expenses', e.target.value)} />
            </div>
          </div>
          <div className="stat-strip cols-3" style={{ marginTop: 6 }}>
            <div className="stat-cell">
              <div className="stat-cell-label">{t('wizard.remainingPayment')}</div>
              <div className="stat-cell-value">{price ? currency(remaining) : '—'}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">{t('wizard.expectedProfit')}</div>
              <div className="stat-cell-value" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {price || expenses ? currency(profit) : '—'}
              </div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">{t('wizard.expectedMargin')}</div>
              <div className="stat-cell-value accent">
                {price ? `${margin}%` : '—'}
              </div>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>{t('wizard.equipmentRequired')}</label>
              <span className="muted" style={{ fontSize: '12px' }}>
                {form.equipment_ids.length} {t('equipment.items')}
              </span>
            </div>

            <div className="gear-picker-wrap">
              <div className="gear-picker-toolbar">
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={equipSearch}
                  onChange={(e) => setEquipSearch(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '12.5px' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '11.5px' }}
                    onClick={() => {
                      const allIds = equipment.map((e) => String(e.id));
                      setForm((f) => ({ ...f, equipment_ids: allIds }));
                    }}
                  >
                    {t('common.all')}
                  </button>
                  {form.equipment_ids.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      onClick={() => setForm((f) => ({ ...f, equipment_ids: [] }))}
                    >
                      {t('common.none')}
                    </button>
                  )}
                </div>
              </div>

              <div className="gear-picker-list">
                {equipment
                  .filter((e) => {
                    if (!equipSearch.trim()) return true;
                    const q = equipSearch.toLowerCase();
                    return (
                      e.name?.toLowerCase().includes(q) ||
                      e.brand?.toLowerCase().includes(q) ||
                      e.category?.toLowerCase().includes(q)
                    );
                  })
                  .map((e) => {
                    const idStr = String(e.id);
                    const isSelected = form.equipment_ids.map(String).includes(idStr);
                    return (
                      <div
                        key={e.id}
                        className={`gear-picker-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setForm((f) => {
                            const cur = f.equipment_ids.map(String);
                            const next = cur.includes(idStr) ? cur.filter((x) => x !== idStr) : [...cur, idStr];
                            return { ...f, equipment_ids: next };
                          });
                        }}
                      >
                        <div className="gear-picker-checkbox">
                          {isSelected && <Icon name="check" size={12} />}
                        </div>
                        <div className="gear-picker-thumb">
                          <EquipPhoto photo={e.photo} alt={e.name} />
                        </div>
                        <div className="gear-picker-info">
                          <div className="gear-picker-name">{e.name}</div>
                          <div className="gear-picker-meta">
                            {[e.brand, e.category].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </div>
                        {e.price != null && (
                          <div className="gear-picker-price">{currency(e.price)}</div>
                        )}
                      </div>
                    );
                  })}
                {equipment.length === 0 && (
                  <div className="muted" style={{ padding: '16px', textAlign: 'center', fontSize: '12.5px' }}>
                    {t('projectDetail.noEquipment')}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label>{t('wizard.productionNotes')}</label>
            <textarea placeholder={t('wizard.productionNotesPh')} value={form.production_notes || ''} onChange={(e) => set('production_notes', e.target.value)} />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="field">
            <label>{t('wizard.tasksOptional')}</label>
            <p className="muted" style={{ fontSize: '12.5px', marginBottom: 12 }}>{t('wizard.tasksHint')}</p>
          </div>
          {form.tasks.map((task, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder={t('wizard.taskPh')}
                value={task}
                onChange={(e) => setTaskAt(i, e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost" onClick={() => removeTaskRow(i)} aria-label="Remove">
                <Icon name="x" />
              </button>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={addTaskRow} style={{ marginTop: 4 }}>
            <Icon name="plus" /> {t('wizard.addTask')}
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <h3 style={{ fontSize: '14px', marginBottom: '14px' }}>{t('wizard.reviewTitle')}</h3>
          <div className="card">
            <div className="meta-row"><span className="muted">{t('wizard.name')}</span><span className="td-strong">{form.name || '—'}</span></div>
            <div className="meta-row"><span className="muted">{t('wizard.type')}</span><span>{form.type}</span></div>
            {form.duration === 'one' ? (
              form.start_date && (
                <div className="meta-row"><span className="muted">{t('wizard.shootDate')}</span><span>{form.start_date}</span></div>
              )
            ) : (
              <>
                {form.start_date && (
                  <div className="meta-row"><span className="muted">{t('wizard.startDate')}</span><span>{form.start_date}</span></div>
                )}
                {form.deadline && (
                  <div className="meta-row"><span className="muted">{t('wizard.deadline')}</span><span>{form.deadline}</span></div>
                )}
              </>
            )}
            <div className="meta-row"><span className="muted">{t('wizard.clientPriceRow')}</span><span className="num td-strong">{currency(price)}</span></div>
            {deposit > 0 && <div className="meta-row"><span className="muted">{t('wizard.deposit')}</span><span className="num">{currency(deposit)}</span></div>}
            <div className="meta-row"><span className="muted">{t('wizard.estimatedExpensesRow')}</span><span className="num">{currency(expenses)}</span></div>
            <div className="meta-row"><span className="muted">{t('wizard.expectedProfitRow')}</span><span className="num" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{currency(profit)}</span></div>
            <div className="meta-row"><span className="muted">{t('projectDetail.equipment')}</span><span className="num">{form.equipment_ids.length}</span></div>
            <div className="meta-row"><span className="muted">{t('projectDetail.tasks')}</span><span className="num">{form.tasks.filter((x) => x.trim()).length}</span></div>
          </div>
        </>
      )}
    </Modal>
  );
}
