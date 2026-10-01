'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useLang } from '../../../lib/i18n';
import { Icon } from '../../../lib/icons';
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || t('login.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="auth-title anim-rise" style={{ '--d': '0.1s' }}>{t('login.welcomeBack')}</h1>
      <p className="auth-sub anim-rise" style={{ '--d': '0.18s' }}>{t('login.subtitle')}</p>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field anim-rise" style={{ '--d': '0.26s' }}>
          <label>{t('login.email')}</label>
          <input type="email" placeholder="you@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field anim-rise" style={{ '--d': '0.34s' }}>
          <label>{t('login.password')}</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="icon-btn auth-pwd-toggle"
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </div>
        <button className="btn btn-primary auth-submit anim-rise" style={{ '--d': '0.42s' }} type="submit" disabled={saving}>
          {saving ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
      <div className="auth-foot anim-rise" style={{ '--d': '0.5s' }}>
        {t('login.teamWorkspace')}
      </div>
    </>
  );
}


