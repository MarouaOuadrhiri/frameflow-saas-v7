'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n';
import { useToast } from './Toast';
import Modal from './Modal';

const EQUIP_CATS = ['Cameras', 'Lenses', 'Audio', 'Lighting', 'Tripods', 'Drones', 'Batteries', 'Memory Cards', 'Storage', 'Accessories'];
const EXPENSE_CATS = ['Equipment', 'Transport', 'Accommodation', 'Staff', 'Studio', 'Food', 'Software', 'Other'];

export function NewClientModal({ open, onClose }) {
  const { toast } = useToast();
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/api/clients', form);
      toast(t('clients.created'));
      onClose();
      setForm({ name: '', email: '', phone: '', company: '', notes: '' });
    } catch (e) {
      toast(e.message || t('common.error'), 'warn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('quickAdd.newClient')}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? t('common.saving') : t('quickAdd.addClient')}
          </button>
        </>
      }
    >
      <div className="field">
        <label>{t('settings.fullName')}</label>
        <input type="text" placeholder={t('quickAdd.clientFullNamePh')} value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>{t('login.email')}</label>
          <input type="email" placeholder="client@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('settings.phone')}</label>
          <input type="text" placeholder="+212 6 00 00 00 00" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{t('quickAdd.companyOptional')}</label>
        <input type="text" placeholder={t('clients.company')} value={form.company} onChange={(e) => set('company', e.target.value)} />
      </div>
      <div className="field">
        <label>{t('clients.notes')}</label>
        <textarea placeholder={t('clients.notesPh')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </Modal>
  );
}

export function AddEquipmentModal({ open, onClose, initial }) {
  const { toast } = useToast();
  const { t } = useLang();
  const emptyForm = { name: '', category: 'Cameras', brand: '', model: '', price: '', purchase_date: '', condition: 'Excellent', damaged: false };
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open && initial?.id) {
      setForm({
        name: initial.name || '',
        category: initial.category || 'Cameras',
        brand: initial.brand || '',
        model: initial.model || '',
        price: initial.price ?? '',
        purchase_date: (initial.purchase_date || '').slice(0, 10),
        condition: initial.condition || 'Excellent',
        damaged: Number(initial.damaged) === 1,
      });
    } else if (!open) {
      setForm(emptyForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id ]);

  useEffect(() => {
    if (!open) {
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const pickPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast(t('quickAdd.imageOnly'), 'warn');
      return;
    }
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: +form.price || null, damaged: form.damaged ? 1 : 0 };
      let id;
      if (isEdit) {
        await api.put(`/api/equipment/${initial.id}`, payload);
        id = initial.id;
        toast(t('quickAdd.equipmentUpdated'));
      } else {
        const created = await api.post('/api/equipment', payload);
        id = created?.id;
        toast(t('quickAdd.equipmentAdded'));
      }
      if (photoFile && id) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await api.upload(`/api/equipment/${id}/photo`, fd);
      }
      onClose();
    } catch (e) {
      toast(e.message || t('common.error'), 'warn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('quickAdd.editEquipment') : t('quickAdd.newEquipment')}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? t('common.saving') : isEdit ? t('quickAdd.saveChanges') : t('quickAdd.addEquipment')}
          </button>
        </>
      }
    >
      <div className="field-row">
        <div className="field">
          <label>{t('equipment.name')}</label>
          <input type="text" placeholder={t('quickAdd.namePh')} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('equipment.category')}</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {EQUIP_CATS.map((c) => (
              <option key={c} value={c}>{t(`equipment.categories.${c}`)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{t('equipment.brand')}</label>
          <input type="text" placeholder={t('quickAdd.brandPh')} value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('equipment.model')}</label>
          <input type="text" placeholder={t('quickAdd.modelPh')} value={form.model} onChange={(e) => set('model', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{t('equipment.photo')}</label>
        <div className="equip-photo-picker">
          {photoPreview ? (
            <img src={photoPreview} alt="Equipment preview" className="equip-photo-preview" />
          ) : (
            <div className="equip-photo-empty">
              <span>{t('equipment.noPhoto')}</span>
            </div>
          )}
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            {photoPreview ? t('equipment.changePhoto') : t('equipment.choosePhoto')}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{t('equipment.purchasePrice')}</label>
          <input type="number" placeholder="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('equipment.purchaseDate')}</label>
          <input type="date" value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{t('equipment.condition')}</label>
        <select value={form.condition} onChange={(e) => set('condition', e.target.value)}>
          {['Excellent', 'Good', 'Fair', 'Needs repair'].map((c) => (
            <option key={c} value={c}>{t(`quickAdd.conditions.${c}`)}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="check-row" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!form.damaged}
            onChange={(e) => set('damaged', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--danger)' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)' }}>
            {t('equipment.damagedHint')}
          </span>
        </label>
      </div>
    </Modal>
  );
}

export function AddExpenseModal({ open, onClose, projectId }) {
  const { toast } = useToast();
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project_id: '', category: 'Equipment', amount: '', description: '', date: '', payment_method: 'Cash' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    api.get('/api/projects').then((d) => setProjects(Array.isArray(d) ? d : d?.projects || [])).catch(() => {});
    setForm((f) => ({ ...f, project_id: projectId || f.project_id || '' }));
  }, [open, projectId]);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/api/expenses', { ...form, amount: +form.amount || 0 });
      toast(t('quickAdd.expenseCreated'));
      onClose();
    } catch (e) {
      toast(e.message || t('common.error'), 'warn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('quickAdd.newExpense')}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? t('common.saving') : t('quickAdd.addExpense')}
          </button>
        </>
      }
    >
      <div className="field">
        <label>{t('quickAdd.project')}</label>
        <select value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
          <option value="">{t('quickAdd.selectProject')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{t('quickAdd.category')}</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {EXPENSE_CATS.map((c) => (
              <option key={c} value={c}>{t(`quickAdd.expenseCats.${c}`)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t('quickAdd.amount')}</label>
          <input type="number" placeholder="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{t('quickAdd.description')}</label>
        <input type="text" placeholder={t('quickAdd.descriptionPh')} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>{t('quickAdd.date')}</label>
          <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('quickAdd.paymentMethod')}</label>
          <select value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
            {['Cash', 'Card', 'Transfer'].map((m) => (
              <option key={m} value={m}>{m === 'Cash' ? t('quickAdd.methodCash') : m === 'Card' ? t('quickAdd.methodCard') : t('quickAdd.methodTransfer')}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}

export function AddPaymentModal({ open, onClose, projectId, defaultAmount }) {
  const { toast } = useToast();
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project_id: '', amount: '', method: 'Bank transfer', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    api.get('/api/projects').then((d) => setProjects(Array.isArray(d) ? d : d?.projects || [])).catch(() => {});
    setForm((f) => ({
      ...f,
      project_id: projectId || f.project_id || '',
      amount: defaultAmount && !f.amount ? String(defaultAmount) : f.amount,
      date: f.date || new Date().toISOString().slice(0, 10),
    }));
  }, [open, projectId, defaultAmount]);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/api/payments', { ...form, amount: +form.amount || 0, status: 'paid' });
      toast(t('quickAdd.paymentCreated'));
      onClose();
      setForm({ project_id: '', amount: '', method: 'Bank transfer', date: new Date().toISOString().slice(0, 10), notes: '' });
    } catch (e) {
      toast(e.message || t('common.error'), 'warn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('quickAdd.newPayment')}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? t('common.saving') : t('quickAdd.addPayment')}
          </button>
        </>
      }
    >
      <div className="field">
        <label>{t('quickAdd.project')}</label>
        <select value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
          <option value="">{t('quickAdd.selectProject')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{t('quickAdd.amount')}</label>
          <input type="number" placeholder="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('quickAdd.paymentMethod')}</label>
          <select value={form.method} onChange={(e) => set('method', e.target.value)}>
            {['Bank transfer', 'Cash', 'Card'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>{t('quickAdd.date')}</label>
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
      </div>
      <div className="field">
        <label>{t('quickAdd.receivedFrom')}</label>
        <textarea placeholder={t('quickAdd.receivedFromPh')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </Modal>
  );
}
