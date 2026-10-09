'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useLang } from '../../../lib/i18n';
import { Icon } from '../../../lib/icons';
/**
 * ============================================================================
 * FrameFlow SaaS — Production Control Center
 * 
 * Module: Authentication / Login Page
 * Author & Lead Developer: Maroua Ouadrhiri
 * Project: frameflow-saas-v7
 * 
 * Feature: 1-Click Demo Login Auto-fill
 * Author: Maroua Ouadrhiri
 * Description: Pre-fills email (maroua@gmail.com) and password (maroua123)
 *              for rapid demo access and portfolio evaluation.
 * ============================================================================
 */

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filled, setFilled] = useState(false);

  /**
   * Demo credentials authored by Maroua Ouadrhiri
   * Used for quick 1-click test fill on portfolio / presentation mode
   */
  const DEMO_CREDENTIALS_MAROUA = {
    author: 'Maroua Ouadrhiri',
    email: 'maroua@gmail.com',
    password: 'maroua123',
  };

  /**
   * Auto-fill handler by Maroua Ouadrhiri
   * Fills email and password with 1 click and gives visual feedback
   */
  const fillMarouaCredentials = () => {
    setEmail(DEMO_CREDENTIALS_MAROUA.email);
    setPassword(DEMO_CREDENTIALS_MAROUA.password);
    setError('');
    setFilled(true);
    setTimeout(() => setFilled(false), 2200);
  };

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
          <input
            type="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
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
              autoComplete="current-password"
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

        {/* ⚡ Demo Credentials 1-Click Fill Button — Developed by Maroua Ouadrhiri */}
        <div className="demo-fill-wrap anim-rise" style={{ '--d': '0.38s' }}>
          <button
            type="button"
            id="btn-demo-maroua"
            className={`btn-demo-fill ${filled ? 'is-filled' : ''}`}
            onClick={fillMarouaCredentials}
            title="Auto-fill credentials for Maroua Ouadrhiri"
            aria-label="Remplir identifiants Maroua Ouadrhiri"
          >
            <div className="demo-fill-avatar">MO</div>
            <div className="demo-fill-meta">
              <span className="demo-fill-name">Maroua Ouadrhiri</span>
              <span className="demo-fill-email">{DEMO_CREDENTIALS_MAROUA.email}</span>
            </div>
            <span className="demo-fill-badge">
              {filled ? '✓ Rempli !' : '⚡ 1-Click Fill'}
            </span>
          </button>
        </div>

        <button className="btn btn-primary auth-submit anim-rise" style={{ '--d': '0.44s' }} type="submit" disabled={saving}>
          {saving ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
      <div className="auth-foot anim-rise" style={{ '--d': '0.52s' }}>
        {t('login.teamWorkspace')}
      </div>
    </>
  );
}



