'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { currency } from '../../../lib/format';
import { Icon } from '../../../lib/icons';
import Badge from '../../../components/Badge';
import StatStrip from '../../../components/StatStrip';
import EmptyState from '../../../components/EmptyState';
import EquipPhoto from '../../../components/EquipPhoto';
import SplashCursor from '../../../components/SplashCursor';
import { useToast } from '../../../components/Toast';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';
import { AddEquipmentModal } from '../../../components/QuickAddModals';

const CATS = ['All', 'Cameras', 'Lenses', 'Audio', 'Lighting', 'Tripods', 'Drones', 'Batteries', 'Memory Cards', 'Storage', 'Accessories'];
const catLabel = (t, c) => {
  const k = `equipment.categories.${c}`;
  const v = t(k);
  return v === k ? c : v;
};

export default function EquipmentPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/api/equipment')
      .then((d) => setItems(Array.isArray(d) ? d : d?.equipment || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  const list = useMemo(() => items.filter((e) => cat === 'All' || e.category === cat), [items, cat]);

  return (
    <div className="page">
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1440}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
        TRANSPARENT={true}
      />
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('equipment.title')}</h1>
          <p className="page-subtitle">{t('equipment.subtitle')}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/purchase-list">{t('nav.purchaseList')}</Link>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" /> {t('equipment.addEquipment')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="stat-strip">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="stat-cell"><div className="skel" style={{ height: 44 }} /></div>
          ))}
        </div>
      ) : (
        <StatStrip
          cols={3}
          stats={[
            { label: t('equipment.items'), value: items.length },
            { label: t('equipment.damagedBadge'), value: items.filter((e) => Number(e.damaged) === 1).length },
            {
              label: t('equipment.totalValue'),
              value: currency(items.reduce((s, e) => s + Number(e.price || 0), 0)),
            },
          ]}
        />
      )}

      <div className="filter-chip-row">
        {CATS.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c === 'All' ? t('equipment.allCategories') : catLabel(t, c)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="equip-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 200 }} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="equipment"
          title={t('equipment.noEquipment')}
          text={t('equipment.noEquipmentText')}
          cta={t('equipment.addEquipment')}
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <div className="equip-grid">
          {list.map((e) => {
            const isDamaged = Number(e.damaged) === 1;
            return (
              <div
                className={`equip-card${isDamaged ? ' damaged' : ''}`}
                key={e.id}
                onClick={() => setEditing(e)}
                title={t('common.edit')}
              >
                <div className="equip-thumb"><EquipPhoto photo={e.photo} alt={e.name} /></div>
                <div className="equip-name">{e.name}</div>
                <div className="equip-brand">{e.brand} · {catLabel(t, e.category)}</div>
                <div className="equip-foot">
                  {isDamaged ? (
                    <Badge color="b-danger">{t('equipment.damagedBadge')}</Badge>
                  ) : (
                    <span className="muted" style={{ fontSize: '11.5px' }}>{e.condition || ''}</span>
                  )}
                  <span className="equip-price">{currency(e.price ?? e.purchase_price)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddEquipmentModal open={modalOpen} onClose={() => { setModalOpen(false); load(); }} />
      <AddEquipmentModal
        open={!!editing}
        initial={editing}
        onClose={() => { setEditing(null); load(); }}
      />
    </div>
  );
}
