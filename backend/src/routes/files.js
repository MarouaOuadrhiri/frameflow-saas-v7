const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { httpError } = require('../utils/crud');

const router = express.Router();

// Shared workspace: folders and files are visible to both teammates.
// `user_id` is written on INSERT only, as an audit trail of who uploaded what.

// ----------------------------------------------------------------------------
// Folders
// ----------------------------------------------------------------------------

// GET /api/files?project_id= -> [{ id, name, file_count }]
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const conds = [];
    const params = [];
    if (req.query.project_id) {
      conds.push('`project_id` = ?');
      params.push(req.query.project_id);
    }
    const [rows] = await pool.query(
      `SELECT \`id\`, \`project_id\`, \`name\`, \`file_count\` FROM \`file_folders\`${
        conds.length ? ` WHERE ${conds.join(' AND ')}` : ''
      } ORDER BY \`id\` ASC`,
      params
    );
    res.json({ data: rows });
  })
);

// POST /api/files -> create a folder
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { project_id, name, file_count } = req.body;
    if (!project_id || !name) throw httpError(400, 'project_id and name are required');
    const [result] = await pool.query(
      'INSERT INTO `file_folders` (`user_id`, `project_id`, `name`, `file_count`) VALUES (?, ?, ?, ?)',
      [req.user.id, project_id, name, Number(file_count) || 0]
    );
    const [rows] = await pool.query('SELECT `id`, `project_id`, `name`, `file_count` FROM `file_folders` WHERE `id` = ?', [
      result.insertId,
    ]);
    res.status(201).json({ data: rows[0] });
  })
);

// DELETE /api/files/:id -> delete a folder (files inside are kept, folder_id set NULL)
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM `file_folders` WHERE `id` = ?', [req.params.id]);
    if (!result.affectedRows) throw httpError(404, 'File folder not found');
    res.json({ data: { deleted: true } });
  })
);

// ----------------------------------------------------------------------------
// Upload storage (multer)
// ----------------------------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads'); // backend/uploads/

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    // Never trust user input for the on-disk path: uuid + original extension.
    const ext = path.extname(file.originalname || '').slice(0, 12);
    cb(null, crypto.randomUUID() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB — raw video files
});

// POST /api/files/upload (multipart/form-data: file, project_id, folder_id?)
// -> { data: { id, original_name, mime_type, size, created_at } }
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, 'No file uploaded (field name must be "file")');

    const projectId = Number(req.body.project_id);
    if (!projectId) {
      fs.unlink(req.file.path, () => {});
      throw httpError(400, 'project_id is required');
    }

    const [projects] = await pool.query('SELECT `id` FROM `projects` WHERE `id` = ?', [projectId]);
    if (!projects.length) {
      fs.unlink(req.file.path, () => {});
      throw httpError(404, 'Project not found');
    }

    let folderId = null;
    if (req.body.folder_id) {
      folderId = Number(req.body.folder_id);
      const [folders] = await pool.query('SELECT `id`, `project_id` FROM `file_folders` WHERE `id` = ?', [folderId]);
      if (!folders.length) {
        fs.unlink(req.file.path, () => {});
        throw httpError(404, 'Folder not found');
      }
      if (Number(folders[0].project_id) !== projectId) {
        fs.unlink(req.file.path, () => {});
        throw httpError(400, 'Folder does not belong to this project');
      }
    }

    const [result] = await pool.query(
      'INSERT INTO `project_files` (`user_id`, `project_id`, `folder_id`, `original_name`, `stored_name`, `mime_type`, `size`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        projectId,
        folderId,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype || null,
        req.file.size || 0,
      ]
    );

    if (folderId) {
      await pool.query('UPDATE `file_folders` SET `file_count` = `file_count` + 1 WHERE `id` = ?', [folderId]);
    }

    const [rows] = await pool.query(
      `SELECT f.\`id\`, f.\`project_id\`, f.\`folder_id\`, f.\`original_name\`, f.\`mime_type\`, f.\`size\`, f.\`created_at\`,
              u.\`name\` AS uploaded_by
       FROM \`project_files\` f
       LEFT JOIN \`users\` u ON u.\`id\` = f.\`user_id\`
       WHERE f.\`id\` = ?`,
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  })
);

// GET /api/files/items?project_id=&folder_id= -> file metadata (uploader name included)
router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const conds = [];
    const params = [];
    if (req.query.project_id) {
      conds.push('f.`project_id` = ?');
      params.push(req.query.project_id);
    }
    if (req.query.folder_id) {
      conds.push('f.`folder_id` = ?');
      params.push(req.query.folder_id);
    }
    const [rows] = await pool.query(
      `SELECT f.\`id\`, f.\`project_id\`, f.\`folder_id\`, f.\`original_name\`, f.\`mime_type\`, f.\`size\`, f.\`created_at\`,
              u.\`name\` AS uploaded_by
       FROM \`project_files\` f
       LEFT JOIN \`users\` u ON u.\`id\` = f.\`user_id\`
       ${conds.length ? `WHERE ${conds.join(' AND ')}` : ''}
       ORDER BY f.\`created_at\` DESC, f.\`id\` DESC`,
      params
    );
    res.json({ data: rows });
  })
);

// Resolve a file row + verify the file exists on disk. 404 when the row is missing.
async function resolveFileRow(id) {
  const [rows] = await pool.query(
    'SELECT `id`, `folder_id`, `original_name`, `stored_name`, `mime_type`, `size` FROM `project_files` WHERE `id` = ?',
    [id]
  );
  if (!rows.length) throw httpError(404, 'File not found');
  const absPath = path.join(UPLOAD_DIR, rows[0].stored_name);
  if (!absPath.startsWith(UPLOAD_DIR + path.sep)) throw httpError(400, 'Invalid file path');
  return { row: rows[0], absPath };
}

// GET /api/files/download/:id -> attachment download with the original filename
router.get(
  '/download/:id',
  asyncHandler(async (req, res) => {
    const { row, absPath } = await resolveFileRow(req.params.id);
    res.download(absPath, row.original_name, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: { message: 'File not found on disk' } });
      }
    });
  })
);

// GET /api/files/stream/:id -> inline Content-Type for image/video preview
router.get(
  '/stream/:id',
  asyncHandler(async (req, res) => {
    const { row, absPath } = await resolveFileRow(req.params.id);
    res.type(row.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.original_name)}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    fs.createReadStream(absPath).on('error', () => {
      if (!res.headersSent) res.status(404).json({ error: { message: 'File not found on disk' } });
      else res.end();
    }).pipe(res);
  })
);

// DELETE /api/files/items/:id -> unlink from disk (ignore ENOENT), delete row, decrement folder count
router.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const { row } = await resolveFileRow(req.params.id);
    const diskPath = path.join(UPLOAD_DIR, row.stored_name);

    await pool.query('DELETE FROM `project_files` WHERE `id` = ?', [row.id]);
    if (row.folder_id) {
      await pool.query(
        'UPDATE `file_folders` SET `file_count` = GREATEST(`file_count` - 1, 0) WHERE `id` = ?',
        [row.folder_id]
      );
    }

    try {
      await fs.promises.unlink(diskPath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    res.json({ data: { deleted: true } });
  })
);

module.exports = router;
