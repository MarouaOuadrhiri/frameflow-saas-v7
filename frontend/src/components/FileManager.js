'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../lib/icons';
import EmptyState from './EmptyState';
import { useToast } from './Toast';
import { useLang } from '../lib/i18n';

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

const isImage = (m) => (m || '').startsWith('image/');
const isVideo = (m) => (m || '').startsWith('video/');

// Small thumbnail: fetches the stream endpoint once, renders an <img>.
// Videos and other files render an icon placeholder instead.
function FileThumb({ file }) {
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
      <Icon name={isImage(file.mime_type) ? 'camera' : 'files'} />
    </div>
  );
}

// Lightbox for previewing one file (image viewer / video player).
function Lightbox({ file, onClose }) {
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
        {!loading && !url && <p className="fm-lightbox-fallback">Preview unavailable — download the file instead.</p>}
        <div className="fm-lightbox-name">{file.original_name}</div>
      </div>
    </div>
  );
}

export default function FileManager({ projectId }) {
  const { toast } = useToast();
  const { t } = useLang();
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const fileInput = useRef(null);
  const dragDepth = useRef(0);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [f, fl] = await Promise.all([
        api.get(`/api/files/items?project_id=${projectId}`),
        api.get(`/api/files?project_id=${projectId}`),
      ]);
      setFiles(Array.isArray(f) ? f : []);
      setFolders(Array.isArray(fl) ? fl : []);
    } catch {
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setActiveFolder('all');
    load();
  }, [projectId, load]);

  const visibleFiles =
    activeFolder === 'all' ? files : files.filter((f) => Number(f.folder_id) === Number(activeFolder));

  const doUpload = async (fileList) => {
    const list = [...fileList].filter(Boolean);
    if (!list.length || !projectId) return;
    setUploading(true);
    let ok = 0;
    for (const file of list) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('project_id', projectId);
      if (activeFolder !== 'all') fd.append('folder_id', activeFolder);
      try {
        await api.upload('/api/files/upload', fd);
        ok += 1;
      } catch (e) {
        toast(t('files.uploadFailed', { name: file.name }), 'warn');
      }
    }
    setUploading(false);
    if (ok) toast(t('files.filesUploaded', { n: ok }), 'upload');
    load();
  };

  const doDownload = async (file) => {
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
    } catch {
      toast(t('files.downloadFailed'), 'warn');
    }
  };

  const doDelete = async (file) => {
    if (!window.confirm(t('files.deleteConfirm', { name: file.original_name }))) return;
    try {
      await api.del(`/api/files/items/${file.id}`);
      toast(t('files.fileDeleted'), 'trash');
      if (lightbox?.id === file.id) setLightbox(null);
      load();
    } catch {
      toast(t('files.deleteFailed'), 'warn');
    }
  };

  const createFolder = async () => {
    const name = folderName.trim();
    if (!name) return;
    try {
      const created = await api.post('/api/files', { project_id: projectId, name });
      setFolders((f) => [...f, created]);
      setFolderName('');
      setShowFolderInput(false);
      setActiveFolder(created.id);
      toast(t('files.folderCreated'), 'files');
    } catch {
      toast(t('files.folderCreateFailed'), 'warn');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (e.dataTransfer?.files?.length) doUpload(e.dataTransfer.files);
  };

  if (!projectId) {
    return <EmptyState icon="files" title={t('files.pickProject')} text={t('files.pickProjectText')} />;
  }

  return (
    <div className="fm">
      {/* Toolbar: folders + upload */}
      <div className="fm-toolbar">
        <div className="fm-pills">
          <button className={`fm-pill ${activeFolder === 'all' ? 'active' : ''}`} onClick={() => setActiveFolder('all')}>
            {t('files.allFiles')} <span className="fm-pill-count">{files.length}</span>
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              className={`fm-pill ${Number(activeFolder) === Number(f.id) ? 'active' : ''}`}
              onClick={() => setActiveFolder(f.id)}
            >
              {f.name} <span className="fm-pill-count">{f.file_count}</span>
            </button>
          ))}
          {showFolderInput ? (
            <span className="fm-inline-input">
              <input
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createFolder();
                  if (e.key === 'Escape') setShowFolderInput(false);
                }}
                placeholder={t('files.folderName')}
              />
              <button className="btn btn-primary btn-sm" onClick={createFolder}>
                <Icon name="check" />
              </button>
            </span>
          ) : (
            <button className="fm-pill fm-pill-add" onClick={() => setShowFolderInput(true)}>
              <Icon name="plus" /> {t('files.newFolder')}
            </button>
          )}
        </div>
        <div className="fm-actions">
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              doUpload(e.target.files);
              e.target.value = '';
            }}
          />
          <button className="btn btn-primary" onClick={() => fileInput.current?.click()} disabled={uploading}>
            <Icon name="upload" /> {uploading ? t('files.uploading') : t('files.upload')}
          </button>
        </div>
      </div>

      {/* Dropzone + grid */}
      <div
        className={`fm-drop ${dragOver ? 'dragover' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragOver(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {dragOver && (
          <div className="fm-drop-hint">
            <Icon name="upload" />
            <span>Drop files to upload{activeFolder !== 'all' ? ' into this folder' : ''}</span>
          </div>
        )}
        {loading ? (
          <div className="fm-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: 210 }} />
            ))}
          </div>
        ) : visibleFiles.length === 0 ? (
          <EmptyState
            icon="files"
            title={t('files.noFilesHere')}
            text="Drag & drop files anywhere, or use the Upload button — photos, videos, contracts, exports."
          />
        ) : (
          <div className="fm-grid">
            {visibleFiles.map((f) => (
              <div className="fm-card" key={f.id}>
                <button
                  className="fm-thumb-btn"
                  onClick={() => (isImage(f.mime_type) || isVideo(f.mime_type) ? setLightbox(f) : doDownload(f))}
                  title={isImage(f.mime_type) || isVideo(f.mime_type) ? t('files.preview') : t('files.download')}
                >
                  <FileThumb file={f} />
                </button>
                <div className="fm-info">
                  <div className="fm-name" title={f.original_name}>
                    {f.original_name}
                  </div>
                  <div className="fm-meta">
                    {formatSize(f.size)}
                    {f.uploaded_by ? ` · ${f.uploaded_by}` : ''}
                  </div>
                </div>
                <div className="fm-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => doDownload(f)} title={t('files.download')}>
                    <Icon name="download" />
                  </button>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => doDelete(f)} title={t('files.delete')}>
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && <Lightbox file={lightbox} onClose={closeLightbox} />}
    </div>
  );
}
