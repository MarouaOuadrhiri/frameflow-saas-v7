'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

// Same dynamic hostname resolution as api.js (duplicated here on purpose —
// realtime.js stays standalone and does not import the API client).
function resolveApiUrl() {
  const buildUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  try {
    if (typeof window === 'undefined') return buildUrl;
    const env = new URL(buildUrl);
    const envIsLocal = env.hostname === 'localhost' || env.hostname === '127.0.0.1';
    const host = window.location.hostname;
    const hostIsLocal = host === 'localhost' || host === '127.0.0.1';
    if (envIsLocal && host && !hostIsLocal) {
      const port = env.port && env.port !== '80' && env.port !== '443' ? env.port : '5000';
      return `${env.protocol}//${host}:${port}`;
    }
  } catch {
    // If anything fails to parse, fall back to the build-time URL.
  }
  return buildUrl;
}

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    socket = io(resolveApiUrl(), { transports: ['websocket', 'polling'], reconnection: true });
  }
  return socket;
}

// Subscribe to live updates broadcast by the backend whenever any teammate
// (same wifi) creates/updates/deletes something. `cb` is re-invoked (debounced).
export function useRealtime(cb, deps = []) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const timer = useRef(null);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const handler = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => cbRef.current(), 600);
    };
    s.on('ff:update', handler);
    return () => {
      s.off('ff:update', handler);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
