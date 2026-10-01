'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import NewProjectWizard from '../../components/NewProjectWizard';
import {
  NewClientModal,
  AddEquipmentModal,
  AddExpenseModal,
  AddPaymentModal,
} from '../../components/QuickAddModals';

export default function AppLayout({ children }) {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null); // project | client | equipment | expense | payment

  // Persist sidebar collapse across reloads
  useEffect(() => {
    try {
      if (localStorage.getItem('ff_sidebar_collapsed') === '1') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ff_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!loading && !token) router.replace('/login');
  }, [loading, token, router]);

  // ⌘K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector('.searchbar input');
        if (input) input.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <div className="app">
        <main className="content">
          <div className="grid kpi-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: 120 }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!token) return null;

  const appClass = `app${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`;

  return (
    <div className={appClass}>
      <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="main">
        <Topbar onHamburger={() => setMobileOpen(true)} onQuickAdd={(id) => setModal(id)} />
        <main className="content">{children}</main>
      </div>

      <NewProjectWizard open={modal === 'project'} onClose={() => setModal(null)} />
      <NewClientModal open={modal === 'client'} onClose={() => setModal(null)} />
      <AddEquipmentModal open={modal === 'equipment'} onClose={() => setModal(null)} />
      <AddExpenseModal open={modal === 'expense'} onClose={() => setModal(null)} />
      <AddPaymentModal open={modal === 'payment'} onClose={() => setModal(null)} />
    </div>
  );
}
