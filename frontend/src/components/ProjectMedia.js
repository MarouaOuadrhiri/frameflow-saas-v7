'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../lib/icons';
import EmptyState from './EmptyState';
import SplashCursor from './SplashCursor';
import { useToast } from './Toast';
import { useLang } from '../lib/i18n';

const isImage = (m) => (m || '').startsWith('image/');
const isVideo = (m) => (m || '').startsWith('video/');
const isDocument = (m, name) => {
  if (isImage(m) || isVideo(m)) return false;
  const ext = (name || '').split('.').pop().toLowerCase();
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', 'rtf', 'odt'].includes(ext);
};

const kindOf = (f) => (isVideo(f.mime_type) ? 'videos' : isDocument(f.mime_type, f.original_name) ? 'documents' : 'files');

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

function MediaThumb({ file }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!isImage(file.mime_type)) return;
    let alive = true;
    let objectUrl = null;
    api
      .downloadBlob(`/api/files/stream/${file.id}`)
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
  }, [file.id, file.mime_type]);

  if (isVideo(file.mime_type)) {
    return (
      <div className="fm-thumb fm-thumb-video">
        <Icon name="tasks" />
        <span className="fm-play">▶</span>
      </div>
    );
  }
  if (url) {
    return (
      <div className="fm-thumb">
        <img src={url} alt={file.original_name} loading="lazy" />
      </div>
    );
  }
  return (
    <div className="fm-thumb">
      <Icon name="camera" />
    </div>
  );
}

function Lightbox({ file, onClose, t }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    setLoading(true);
    api
      .downloadBlob(`/api/files/stream/${file.id}`)
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, onClose]);

  return (
    <div className="fm-lightbox" onClick={onClose}>
      <button className="fm-lightbox-close" onClick={onClose} aria-label="Close">
        <Icon name="x" />
      </button>
      <div className="fm-lightbox-body" onClick={(e) => e.stopPropagation()}>
        {loading && <div className="skel" style={{ width: 320, height: 220, borderRadius: 12 }} />}
        {!loading && url && isImage(file.mime_type) && <img src={url} alt={file.original_name} />}
        {!loading && url && isVideo(file.mime_type) && <video src={url} controls autoPlay />}
        {!loading && !url && <p className="fm-lightbox-fallback">{t('media.chooseFile')}</p>}
        <div className="fm-lightbox-name">{file.original_name}</div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'files', labelKey: 'media.filesFolder', hintKey: 'media.filesHint', icon: 'camera', accept: 'image/*' },
  { id: 'videos', labelKey: 'media.videosFolder', hintKey: 'media.videosHint', icon: 'tasks', accept: 'video/*' },
  { id: 'documents', labelKey: 'media.documentsFolder', hintKey: 'media.documentsHint', icon: 'doc', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip' },
];

// Per-project media library organised in three folders: files (photos &
// misc), videos and documents — mirroring the reference layout.
export default function ProjectMedia({ projectId }) {
  const { toast } = useToast();
  const { t } = useLang();
  const [files, setFiles] = useState([]);
  const [tab, setTab] = useState('files');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const inputRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/files/items?project_id=${projectId}`)
      .then((d) => {
        const all = Array.isArray(d) ? d : d?.items || [];
        setFiles(all);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeTab = TABS.find((x) => x.id === tab);
  const shown = files.filter((f) => kindOf(f) === tab);
  const counts = {
    files: files.filter((f) => kindOf(f) === 'files').length,
    videos: files.filter((f) => kindOf(f) === 'videos').length,
    documents: files.filter((f) => kindOf(f) === 'documents').length,
  };

  const uploadFiles = async (list) => {
    const items = Array.from(list || []);
    if (!items.length) return;
    setUploading(true);
    try {
      for (const file of items) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('project_id', projectId);
        await api.upload('/api/files/upload', fd);
      }
      toast(items.length === 1 ? t('media.uploaded') : `${items.length} — ${t('media.uploaded')}`);
      load();
    } catch (e) {
      toast(e.message, 'warn');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (file) => {
    if (!confirm(t('media.deleteConfirm', { name: file.original_name }))) return;
    try {
      await api.del(`/api/files/items/${file.id}`);
      toast(t('media.deleted'));
      load();
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const emptyTitles = { files: t('media.noFiles'), videos: t('media.noVideos'), documents: t('media.noDocuments') };

  const download = async (file) => {
    try {
      const blob = await api.downloadBlob(`/api/files/download/${file.id}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 8000);
    } catch (e) {
      toast(t('media.downloadFailed'), 'warn');
    }
  };

  return (
    <div>
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
      <div className="fm-toolbar" style={{ marginBottom: 16 }}>
        <div className="fm-pills">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              className={`fm-pill ${tab === tb.id ? 'active' : ''}`}
              onClick={() => setTab(tb.id)}
            >
              <Icon name={tb.icon} size={13} /> {t(tb.labelKey)} <span className="fm-pill-count">{counts[tb.id]}</span>
            </button>
          ))}
        </div>
        <div className="fm-actions">
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Icon name="plus" /> {uploading ? t('common.uploading') : activeTab.id === 'files' ? t('media.addFiles') : activeTab.id === 'videos' ? t('media.addVideos') : t('media.addDocuments')}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={activeTab.accept}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div
        className={`fm-drop ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
      >
        {loading ? (
          <div className="fm-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: 170 }} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={activeTab.icon}
            title={emptyTitles[tab]}
            text={t(activeTab.hintKey)}
            cta={activeTab.id === 'files' ? t('media.addFiles') : activeTab.id === 'videos' ? t('media.addVideos') : t('media.addDocuments')}
            onCta={() => inputRef.current?.click()}
          />
        ) : (
          <div className="fm-grid">
            {shown.map((f) => (
              <div key={f.id} className="fm-card">
                <div className="fm-thumb-wrap" onClick={() => setLightbox(f)}>
                  <MediaThumb file={f} />
                </div>
                <div className="fm-card-body">
                  <div className="fm-card-name" title={f.original_name}>{f.original_name}</div>
                  <div className="fm-card-meta">{formatSize(f.size)}</div>
                  <div className="fm-card-actions">
                    <button className="icon-btn" onClick={() => setLightbox(f)} aria-label="Preview">
                      <Icon name="eye" size={13} />
                    </button>
                    <button className="icon-btn" onClick={() => download(f)} title={t('media.download')} aria-label="Download">
                      <Icon name="download" size={13} />
                    </button>
                    <button className="icon-btn danger" onClick={() => remove(f)} aria-label="Delete">
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && <Lightbox file={lightbox} onClose={closeLightbox} t={t} />}
    </div>
  );
}
