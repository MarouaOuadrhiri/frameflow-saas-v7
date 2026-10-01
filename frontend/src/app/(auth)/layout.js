'use client';

import SplashCursor from '../../components/SplashCursor';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-wrap">
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
      />
      <div className="auth-card">
        <div className="auth-brand anim-rise" style={{ '--d': '0s' }}>
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 7h11l3 3v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="#F5F5F5" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="10.5" cy="13.5" r="2.6" stroke="#F5F5F5" strokeWidth="1.6" />
              <path d="M14 6.5V5a1 1 0 0 1 1-1h2.5" stroke="#F5F5F5" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-name">FrameFlow</div>
        </div>
        {children}
      </div>
    </div>
  );
}
