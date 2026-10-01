'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import FileManager from '../../../components/FileManager';
import EmptyState from '../../../components/EmptyState';
import SplashCursor from '../../../components/SplashCursor';
import { useLang } from '../../../lib/i18n';
import { useRealtime } from '../../../lib/realtime';

export default function FilesPage() {
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/api/projects')
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setProjects(list);
        if (list.length) setProjectId(String(list[0].id));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(() => load(), []);

  return (
    <div className="page">
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1440}
        CAPTURE_RESOLUTION={512}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        PRESSURE_ITERATIONS={20}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        SHADING={true}
        COLORFUL={true}
        COLOR_UPDATE_SPEED={10}
        BACK_COLOR={{ r: 0.5, g: 0, b: 0 }}
        TRANSPARENT={true}
      />
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('files.title')}</h1>
          <p className="page-subtitle">{t('files.subtitle')}</p>
        </div>
        <div className="page-actions">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={loading || !projects.length}
            aria-label={t('files.selectProject')}
            style={{ width: 'auto', minWidth: 200 }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="fm-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 210 }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon="files" title={t('files.noProjects')} text={t('files.noProjectsText')} />
      ) : (
        <FileManager projectId={projectId} />
      )}
    </div>
  );
}
