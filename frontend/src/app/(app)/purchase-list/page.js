'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { currency } from '../../../lib/format';
import { Icon } from '../../../lib/icons';
import Badge from '../../../components/Badge';
import DataTable from '../../../components/DataTable';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import { useToast } from '../../../components/Toast';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';

const STATUS_MAP = { 'To buy': 'b-warning', Ordered: 'b-info', Received: 'b-success', Cancelled: 'b-neutral' };
const PRIORITY_MAP = { High: 'b-danger', Medium: 'b-warning', Low: 'b-neutral' };
const NEXT_STATUS = { 'To buy': 'Ordered', Ordered: 'Received', Received: 'To buy' };

export default function PurchaseListPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ item: '', category: '', qty: 1, est_price: '', priority: 'Medium' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/api/purchase-items')
      .then((d) => setItems(Array.isArray(d) ? d : d?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  const total = items.reduce((s, i) => s + (i.price || i.est_price || 0) * (i.qty || 1), 0);

  const advanceStatus = async (item) => {
    const next = NEXT_STATUS[item.status] || 'To buy';
    const prev = items;
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, status: next } : x)));
    try {
      const updated = await api.put(`/api/purchase-items/${item.id}`, { status: next });
      if (updated && updated.converted) {
        // The item became equipment and left the purchase list — refresh.
        toast(t('purchase.movedToEquipment'));
        load();
      } else {
        toast(`${t('common.status')}: ${next}`);
      }
    } catch (e) {
      setItems(prev);
      toast(e.message, 'warn');
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.item.trim()) {
      toast(t('validation.required'), 'warn');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/purchase-items', {
        item: form.item.trim(),
        category: form.category,
        qty: +form.qty || 1,
        est_price: +form.est_price || null,
        priority: form.priority,
        status: 'To buy',
      });
      toast(t('purchase.created'));
      setModalOpen(false);
      setForm({ item: '', category: '', qty: 1, est_price: '', priority: 'Medium' });
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
          <h1 className="page-title">{t('purchase.title')}</h1>
          <p className="page-subtitle">{t('purchase.subtitle')}</p>
        </div>
        <div className="page-actions">
          <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="muted" style={{ fontSize: '12px' }}>{t('purchase.totalEstimate')}</span>
            <span className="num" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-hover)' }}>
              {loading ? '—' : currency(total)}
            </span>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" /> {t('purchase.addItem')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skel" style={{ height: 320 }} />
      ) : items.length === 0 ? (
        <EmptyState icon="purchase" title={t('purchase.noItems')} text={t('purchase.noItemsText')} cta={t('purchase.addItem')} onCta={() => setModalOpen(true)} />
      ) : (
        <DataTable
          rowKey="id"
          columns={[
            { key: 'item', label: t('purchase.item'), strong: true },
            { key: 'category', label: t('common.type') },
            { key: 'qty', label: t('purchase.quantity'), render: (i) => <span className="num">{i.qty || 1}</span> },
            { key: 'price', label: t('purchase.estimatedPrice'), render: (i) => <span className="num">{currency(i.est_price ?? i.price)}</span> },
            { key: 'priority', label: t('common.priority'), render: (i) => <Badge color={PRIORITY_MAP[i.priority] || 'b-neutral'}>{t(`purchase.priorities.${i.priority}`)}</Badge> },
            { key: 'status', label: t('common.status'), render: (i) => <Badge color={STATUS_MAP[i.status] || 'b-neutral'}>{t(`purchase.statuses.${i.status}`)}</Badge> },
            { key: 'project', label: t('projects.project'), render: (i) => i.project_name || i.project || '—' },
            {
              key: 'actions',
              label: '',
              render: (i) => (
                <div className="row-actions">
                  <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11.5px' }} onClick={(e) => { e.stopPropagation(); advanceStatus(i); }}>
                    {t('common.update')} → {NEXT_STATUS[i.status] || 'To buy'}
                  </button>
                </div>
              ),
            },
          ]}
          rows={items}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('purchase.addItem')}
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
          <label>{t('purchase.item')}</label>
          <input type="text" placeholder={t('purchase.itemPh')} value={form.item} onChange={(e) => set('item', e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t('purchase.estimatedPrice')}</label>
            <input type="number" value={form.est_price} onChange={(e) => set('est_price', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('purchase.quantity')}</label>
            <input type="number" min="1" value={form.qty} onChange={(e) => set('qty', e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t('common.type')}</label>
            <input type="text" value={form.category} onChange={(e) => set('category', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('common.priority')}</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {['High', 'Medium', 'Low'].map((p) => (
                <option key={p} value={p}>{t(`purchase.priorities.${p}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
