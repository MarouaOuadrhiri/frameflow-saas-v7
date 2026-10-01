'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Home() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(token ? '/dashboard' : '/login');
    }
  }, [loading, token, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#090b10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skel" style={{ width: 140, height: 28, borderRadius: 8 }} />
    </div>
  );
}
