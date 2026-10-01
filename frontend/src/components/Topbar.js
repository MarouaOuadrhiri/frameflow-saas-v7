'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '../lib/icons';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/i18n';
import { api } from '../lib/api';
import Avatar from './Avatar';
import QuickAddMenu from './QuickAddMenu';

function NotificationsDropdown({ open, toggle, close }) {
  const [items, setItems] = useState([]);
  const router = useRouter();
  const { t } = useLang();

  const fetchItems = () =>
    api
      .get('/api/notifications')
      .then((data) => setItems(Array.isArray(data) ? data : data?.notifications || []))
      .catch(() => setItems([]));

  // Fetch on open, plus poll every 5 minutes so 1-hour-before
  // calendar reminders pop up on the bell without a page reload.
  useEffect(() => {
    fetchItems();
    const t = setInterval(fetchItems, 5 * 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (open) fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  return (
    <div className={`dropdown ${open ? 'open' : ''}`}>
      <button className="icon-btn" onClick={() => toggle('notif')} aria-label={t('topbar.notifications')}>
        <Icon name="notifications" />
        {unread > 0 && <span className="dot-badge" />}
      </button>
      <div className="dropdown-panel notif-panel">
        <div style={{ padding: '8px 10px 10px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-dim)' }}>
          {t('topbar.notifications')}
        </div>
        {items.length === 0 && (
          <div className="muted" style={{ padding: '10px 12px', fontSize: '12.5px' }}>
            {t('topbar.caughtUp')}
          </div>
        )}
        {items.slice(0, 6).map((n) => (
          <div
            className="notif-item"
            key={n.id}
            onClick={() => {
              markRead(n.id);
              close();
              router.push('/notifications');
            }}
          >
            <div
              className="notif-ic"
              style={{
                background: `var(--${n.color || 'info'}-soft)`,
                color: `var(--${n.color || 'info'})`,
              }}
            >
              <Icon name={n.icon || 'bell'} />
            </div>
            <div>
              <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.text }} />
              <div className="notif-time">{n.time || n.created_at}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Topbar({ onHamburger, onQuickAdd }) {
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));
  const close = () => setOpenId(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.dropdown')) close();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    router.push(`/projects${query ? `?search=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <header className="topbar">
      <button className="icon-btn hamburger" onClick={onHamburger} aria-label="Menu">
        <Icon name="hamburger" />
      </button>
      <form className="searchbar" onSubmit={submitSearch}>
        <Icon name="search" />
        <input
          type="text"
          placeholder={t('topbar.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="kbd">⌘K</span>
      </form>
      <div className="topbar-right">
        <QuickAddMenu onPick={onQuickAdd} />
        <NotificationsDropdown open={openId === 'notif'} toggle={toggle} close={close} />
        <div className={`dropdown ${openId === 'profile' ? 'open' : ''}`}>
          <Avatar name={user?.name || 'FF'} size="sm" onClick={() => toggle('profile')} />
          <div className="dropdown-panel" style={{ width: 180 }}>
            <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{user?.name || 'FrameFlow User'}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: 2 }}>{user?.email || ''}</div>
            </div>
            <div
              className="dropdown-item"
              style={{ color: 'var(--danger)', marginTop: 4 }}
              onClick={() => {
                close();
                logout();
              }}
            >
              <Icon name="logout" /> {t('nav.signOut')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
