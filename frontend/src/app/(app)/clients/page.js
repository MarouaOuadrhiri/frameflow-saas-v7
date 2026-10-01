'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { currency } from '../../../lib/format';
import { Icon } from '../../../lib/icons';
import Avatar from '../../../components/Avatar';
import DataTable from '../../../components/DataTable';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import Badge from '../../../components/Badge';
import { NewClientModal } from '../../../components/QuickAddModals';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';

function ClientProjectsModal({ clientId, onClose }) {
  const { t } = useLang();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    api
      .get(`/api/clients/${clientId}`)
      .then((d) => setClient(d?.data || d?.client || d))
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  const projects = client?.projects || [];

  return (
    <Modal open={!!clientId} onClose={onClose} title={t('clients.projectsOf', { name: client?.name || '' })} wide>
      {loading ? (
        <div className="skel" style={{ height: 220 }} />
      ) : projects.length === 0 ? (
        <EmptyState icon="projects" title={t('clients.noProjects')} text="" />
      ) : (
        <DataTable
          rowKey="id"
          columns={[
            { key: 'name', label: t('projects.project'), strong: true },
            { key: 'type', label: t('common.type') },
            { key: 'status', label: t('common.status'), render: (p) => <Badge color="b-info">{p.status}</Badge> },
            { key: 'price', label: t('clients.price'), render: (p) => <span className="num td-strong">{currency(p.price)}</span> },
            { key: 'paid', label: t('clients.paid'), render: (p) => <span className="num">{currency(p.paid_total ?? p.paid)}</span> },
          ]}
          rows={projects}
          onRowClick={(p) => {
            onClose();
            router.push(`/projects/${p.id}`);
          }}
        />
      )}
    </Modal>
  );
}

export default function ClientsPage() {
  const { t } = useLang();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/api/clients')
      .then((d) => setClients(Array.isArray(d) ? d : d?.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('clients.title')}</h1>
          <p className="page-subtitle">{t('clients.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" /> {t('clients.newClient')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skel" style={{ height: 320 }} />
      ) : clients.length === 0 ? (
        <EmptyState icon="clients" title={t('clients.noClients')} text={t('clients.noClientsText')} cta={t('clients.newClient')} onCta={() => setModalOpen(true)} />
      ) : (
        <DataTable
          rowKey="id"
          columns={[
            {
              key: 'name',
              label: t('clients.client'),
              render: (c) => (
                <button className="link-row" onClick={() => setDetailId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <Avatar name={c.name} size="sm" />
                  <div style={{ textAlign: 'start' }}>
                    <div className="td-strong">{c.name}</div>
                    <div className="muted" style={{ fontSize: '11px' }}>{c.projects_count ?? 0} {t('clients.projects').toLowerCase()} · <span style={{ color: 'var(--accent)' }}>{t('clients.viewProjects')}</span></div>
                  </div>
                </button>
              ),
            },
            { key: 'company', label: t('clients.company') },
            { key: 'total_revenue', label: t('clients.totalRevenue'), render: (c) => <span className="num td-strong">{currency(c.total_revenue)}</span> },
            {
              key: 'outstanding',
              label: t('clients.outstanding'),
              render: (c) => (
                <span className="num" style={{ color: (c.outstanding || 0) > 0 ? 'var(--warning)' : 'var(--text-faint)' }}>
                  {currency(c.outstanding)}
                </span>
              ),
            },
            { key: 'last_project', label: t('clients.lastProject'), render: (c) => c.last_project || '—' },
          ]}
          rows={clients}
          onRowClick={(c) => setDetailId(c.id)}
        />
      )}

      <ClientProjectsModal clientId={detailId} onClose={() => setDetailId(null)} />
      <NewClientModal open={modalOpen} onClose={() => { setModalOpen(false); load(); }} />
    </div>
  );
}
