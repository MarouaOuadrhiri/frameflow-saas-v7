'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../lib/icons';
import { useAuth } from '../lib/auth';
import { useLang, useTheme } from '../lib/i18n';
import Avatar from './Avatar';

const NAV = [
  {
    secKey: 'nav.workspace',
    items: [
      { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
      { id: 'projects', labelKey: 'nav.projects', icon: 'projects' },
      { id: 'calendar', labelKey: 'nav.calendar', icon: 'calendar' },
      { id: 'clients', labelKey: 'nav.clients', icon: 'clients' },
    ],
  },
  {
    secKey: 'nav.production',
    items: [
      { id: 'equipment', labelKey: 'nav.equipment', icon: 'equipment' },
      { id: 'purchase-list', labelKey: 'nav.purchaseList', icon: 'purchase' },
      { id: 'tasks', labelKey: 'nav.tasks', icon: 'tasks' },
    ],
  },
  {
    secKey: 'nav.business',
    items: [
      { id: 'analytics', labelKey: 'nav.analytics', icon: 'analytics' },
      { id: 'files', labelKey: 'nav.files', icon: 'files' },
      { id: 'notifications', labelKey: 'nav.notifications', icon: 'notifications' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggleCollapse, onCloseMobile }) {
  const pathname = usePathname() || '';
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const active = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 7h11l3 3v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="#F5F5F5" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="10.5" cy="13.5" r="2.6" stroke="#F5F5F5" strokeWidth="1.6" />
            <path d="M14 6.5V5a1 1 0 0 1 1-1h2.5" stroke="#F5F5F5" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand-name">FrameFlow</div>
      </div>
      <nav className="nav">
        {NAV.map((sec, si) => (
          <div key={si}>
            {sec.secKey && <div className="nav-section-title">{t(sec.secKey)}</div>}
            {sec.items.map((it) => (
              <Link
                key={it.id}
                href={`/${it.id}`}
                className={`navitem ${it.id === active ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <Icon name={it.icon} />
                <span className="navlabel">{t(it.labelKey)}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="prefs-row">
          <button className="pref-btn" onClick={toggleTheme} title={t('common.theme')}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
            <span className="collapse-label">{theme === 'dark' ? t('common.light') : t('common.dark')}</span>
          </button>
          <button
            className="pref-btn"
            onClick={() => setLang(lang === 'en' ? 'fr' : lang === 'fr' ? 'ar' : 'en')}
            title={t('common.language')}
          >
            <Icon name="globe" size={15} />
            <span className="collapse-label">{lang === 'en' ? 'FR' : lang === 'fr' ? 'AR' : 'EN'}</span>
          </button>
        </div>
        <div className="userbox" onClick={logout} title={t('nav.signOut')}>
          <Avatar name={user?.name || 'FF'} online />
          <div className="userbox-info">
            <div className="userbox-name">{user?.name || 'FrameFlow User'}</div>
            <div className="userbox-role">{user?.role || 'Director'} · {t('nav.online')}</div>
          </div>
        </div>
        <button className="collapse-btn" onClick={onToggleCollapse}>
          <Icon name="chevron" />
          <span className="collapse-label">{t('nav.collapse')}</span>
        </button>
      </div>
    </aside>
  );
}
