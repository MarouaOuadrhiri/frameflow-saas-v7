'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '../lib/icons';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/i18n';
import Avatar from './Avatar';

export default function QuickAddMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  const QUICK_ADD_OPTIONS = [
    { id: 'project', label: t('quickAdd.newProject'), sub: t('quickAdd.projectSub'), icon: 'projects' },
    { id: 'client', label: t('quickAdd.newClient'), sub: t('quickAdd.clientSub'), icon: 'clients' },
    { id: 'equipment', label: t('equipment.addEquipment'), sub: t('quickAdd.equipmentSub'), icon: 'equipment' },
    { id: 'expense', label: t('quickAdd.newExpense'), sub: t('quickAdd.expenseSub'), icon: 'expense' },
    { id: 'payment', label: t('quickAdd.newPayment'), sub: t('quickAdd.paymentSub'), icon: 'payments' },
  ];

  return (
    <div className={`dropdown ${open ? 'open' : ''}`}>
      <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
        <Icon name="plus" />
        <span className="qa-label">{t('quickAdd.quickAddLabel')}</span>
      </button>
      <div className="dropdown-panel" style={{ width: 210 }}>
        {QUICK_ADD_OPTIONS.map((opt) => (
          <div
            key={opt.id}
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              onPick(opt.id);
            }}
          >
            <Icon name={opt.icon} />
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useDropdown() {
  const [openId, setOpenId] = useState(null);
  return {
    isOpen: (id) => openId === id,
    toggle: (id) => setOpenId((cur) => (cur === id ? null : id)),
    close: () => setOpenId(null),
  };
}
