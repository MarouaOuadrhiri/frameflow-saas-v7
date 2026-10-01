'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../lib/icons';

// Equipment photo thumbnail. Loads through the authenticated photo endpoint
// (Bearer token), falls back to the camera icon when there is no photo.
export default function EquipPhoto({ photo, alt }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!photo) return;
    let alive = true;
    let objectUrl = null;
    api
      .downloadBlob(`/api/equipment/photo/${encodeURIComponent(photo)}`)
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);

  if (url) return <img src={url} alt={alt || 'Equipment photo'} loading="lazy" />;
  return <Icon name="camera" />;
}
