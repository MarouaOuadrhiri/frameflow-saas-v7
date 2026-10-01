'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { useToast } from '../../../components/Toast';
import { useLang, useTheme } from '../../../lib/i18n';
import { Icon } from '../../../lib/icons';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState('profile');
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', bio: '' });

  // 'Checklist templates' was removed from the app entirely (v4), so the
  // obsolete nav entry is dropped; 'Team' refers to the two shared accounts.
  const NAV = [
    { id: 'profile', label: t('settings.profile') },
    { id: 'company', label: t('settings.company') },
    { id: 'notifications', label: t('settings.notifications') },
    { id: 'currency', label: t('settings.currency') },
    { id: 'appearance', label: t('settings.appearance') },
    { id: 'security', label: t('settings.security') },
    { id: 'team', label: t('settings.team') },
    { id: 'categories', label: t('settings.categories') },
  ];

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        role: user.role || 'Director / Founder',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    // PUT /api/auth/me is not guaranteed by the backend contract;
    // update locally and confirm to the user.
    setUser({ ...user, ...form });
    toast(t('settings.profileSaved'));
  };

  const sectionLabel = (NAV.find((n) => n.id === section) || {}).label || section;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
      </div>
      <div className="settings-layout">
        <div className="settings-nav">
          {NAV.map((n) => (
            <a key={n.id} className={section === n.id ? 'active' : ''} onClick={() => setSection(n.id)}>
              {n.label}
            </a>
          ))}
        </div>
        <div className="card">
          {section === 'profile' ? (
            <>
              <h3 style={{ fontSize: '15px', marginBottom: 18 }}>{t('settings.profile')}</h3>
              <div className="field-row">
                <div className="field">
                  <label>{t('settings.fullName')}</label>
                  <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="field">
                  <label>{t('settings.role')}</label>
                  <input type="text" value={form.role} onChange={(e) => set('role', e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>{t('login.email')}</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="field">
                  <label>{t('settings.phone')}</label>
                  <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>{t('settings.bio')}</label>
                <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} />
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setSection('profile')}>{t('common.cancel')}</button>
                <button className="btn btn-primary" onClick={save}>{t('common.save')}</button>
              </div>
            </>
          ) : section === 'appearance' ? (
            <>
              <h3 style={{ fontSize: '15px', marginBottom: 18 }}>{t('settings.appearance')}</h3>
              <div className="field">
                <label>{t('common.theme')}</label>
                <div className="view-toggle" style={{ width: 'fit-content' }}>
                  <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
                    <Icon name="sun" /> {t('common.light')}
                  </button>
                  <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
                    <Icon name="moon" /> {t('common.dark')}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>{t('common.language')}</label>
                <div className="view-toggle" style={{ width: 'fit-content' }}>
                  <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
                    English
                  </button>
                  <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>
                    Français
                  </button>
                  <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>
                    العربية
                  </button>
                </div>
              </div>
            </>
          ) : section === 'currency' ? (
            <>
              <h3 style={{ fontSize: '15px', marginBottom: 18 }}>{t('settings.currency')}</h3>
              <div className="field">
                <label>{t('common.currency') || 'Currency'}</label>
                <select value="MAD" disabled>
                  <option value="MAD">MAD — Moroccan Dirham (DH)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '15px', marginBottom: 18 }}>{sectionLabel}</h3>
              <p className="muted" style={{ fontSize: '13px' }}>
                {t('settings.comingSoon')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
