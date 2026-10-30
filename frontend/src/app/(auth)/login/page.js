'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useLang } from '../../../lib/i18n';
import { Icon } from '../../../lib/icons';
import SplashCursor from '../../../components/SplashCursor';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLang();
  // Demo build: login pre-filled with the demo account so anyone can test the app in one click.
  const [email, setEmail] = useState('yassine@frameflow.studio');
  const [password, setPassword] = useState('demo1234');
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

  // Dev-only one-click login: credentials come from .env.local (never committed),
  // and the button is hidden in production builds.
  const showQuickLogin =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEMO_EMAIL &&
    process.env.NEXT_PUBLIC_DEMO_PASSWORD;

  const quickLogin = async () => {
    setError('');
    setSaving(true);
    try {
      await login(process.env.NEXT_PUBLIC_DEMO_EMAIL, process.env.NEXT_PUBLIC_DEMO_PASSWORD);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || t('login.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
              className="icon-btn"
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </div>
        <button className="btn btn-primary auth-submit anim-rise" style={{ '--d': '0.42s' }} type="submit" disabled={saving}>
          {saving ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
      {showQuickLogin && (
        <button
          type="button"
          className="btn auth-submit anim-rise"
          style={{ '--d': '0.46s', marginTop: 12, opacity: 0.9 }}
          onClick={quickLogin}
          disabled={saving}
        >
          {t('login.quickLogin')}
        </button>
      )}
      <div className="auth-foot anim-rise" style={{ '--d': '0.5s' }}>
        {t('login.teamWorkspace')}
      </div>
    </>
  );
}
