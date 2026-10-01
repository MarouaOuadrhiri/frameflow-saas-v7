// Resolve the API base URL at runtime so the SAME build works on:
//  - http://localhost:3000            (local dev)
//  - http://project-management        (hosts entry + port 80 -> 3000 proxy)
//  - http://192.168.x.x(:3000)        (LAN access from another PC / phone)
// NEXT_PUBLIC_API_URL stays the build-time base; when it points at
// localhost/127.0.0.1 (or is unset) and the browser is on a real LAN host,
// the API hostname follows the browser's hostname (keeping any explicit
// non-default port from the env URL, else defaulting to 5000).
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

const API_URL = resolveApiUrl();

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ff_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const message = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json?.data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
  // Multipart upload (FormData) — no JSON Content-Type, Bearer token attached.
  upload: async (path, formData) => {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
    let json = null;
    try {
      json = await res.json();
    } catch {
      // non-JSON response
    }
    if (!res.ok) {
      const message = json?.error?.message || json?.message || `Upload failed (${res.status})`;
      throw new Error(message);
    }
    return json?.data;
  },
  // Binary download (file attachments, previews) — returns a Blob.
  downloadBlob: async (path) => {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { method: 'GET', headers });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    return res.blob();
  },
  API_URL,
};
