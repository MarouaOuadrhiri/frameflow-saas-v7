'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Icon } from '../../../lib/icons';
import { useToast } from '../../../components/Toast';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';
import EmptyState from '../../../components/EmptyState';

export default function NotificationsPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/api/notifications')
      .then((d) => setItems(Array.isArray(d) ? d : d?.notifications || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const markAll = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast(t('notifications.markAllDone'));
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notifications.title')}</h1>
          <p className="page-subtitle">{t('notifications.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={markAll}>
            <Icon name="check" /> {t('notifications.markAll')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 54, marginBottom: 10 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="notifications" title={t('notifications.noNotifications')} text={t('notifications.noNotificationsText')} />
      ) : (
        <div>
          {items.map((n) => (
            <div
              className="alert-item"
              key={n.id}
              style={!n.read ? { borderColor: 'var(--accent)' } : undefined}
            >
              <div
                className="alert-ic"
                style={{ background: `var(--${n.color || 'info'}-soft)`, color: `var(--${n.color || 'info'})` }}
              >
                <Icon name={n.icon || 'bell'} />
              </div>
              <div className="alert-text" style={{ flex: 1 }}>
                <span dangerouslySetInnerHTML={{ __html: n.text }} />
                <div className="alert-time">{n.time || n.created_at}</div>
              </div>
              {!n.read && (
                <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => markRead(n.id)}>
                  {t('notifications.markRead')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
