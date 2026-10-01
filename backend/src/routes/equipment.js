const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { httpError } = require('../utils/crud');

const router = express.Router();

// Shared workspace: equipment is visible to both teammates.
// `user_id` is written on INSERT only, as an audit trail of who added each item.

const WRITABLE = ['name', 'brand', 'model', 'category', 'price', 'purchase_date', 'condition', 'damaged'];

const pickWritable = (body = {}) => {
  const out = {};
  for (const f of WRITABLE) {
    if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== undefined) {
      out[f] = body[f];
    }
  }
  // `damaged` is a boolean flag in the API — store as 0/1.
  if (Object.prototype.hasOwnProperty.call(out, 'damaged')) {
    out.damaged = out.damaged ? 1 : 0;
  }
  return out;
};

// ----------------------------------------------------------------------------
// Equipment photo storage
// ----------------------------------------------------------------------------
const PHOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'equipment');
fs.mkdirSync(PHOTO_DIR, { recursive: true });

const photoStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, PHOTO_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 12);
    cb(null, crypto.randomUUID() + ext);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — photos only
  fileFilter(_req, file, cb) {
    if ((file.mimetype || '').startsWith('image/')) cb(null, true);
    else cb(httpError(400, 'Only image files are allowed as equipment photos'));
  },
});

async function removePhotoFile(filename) {
  if (!filename) return;
  const abs = path.join(PHOTO_DIR, path.basename(filename));
  if (!abs.startsWith(PHOTO_DIR + path.sep)) return;
  try {
    await fs.promises.unlink(abs);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// ----------------------------------------------------------------------------
// CRUD — same contract as the other resources
// ----------------------------------------------------------------------------

// GET /api/equipment?damaged=1 -> [{...}]
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const conds = [];
    const params = [];
    if (req.query.damaged !== undefined && req.query.damaged !== '') {
      conds.push('`damaged` = ?');
      params.push(req.query.damaged === '1' || req.query.damaged === 'true' ? 1 : 0);
    }
    const [rows] = await pool.query(
      `SELECT * FROM \`equipment\`${conds.length ? ` WHERE ${conds.join(' AND ')}` : ''} ORDER BY \`name\` ASC, \`id\` DESC`,
      params
    );
    res.json({ data: rows });
  })
);

// POST /api/equipment -> { data: {...created} }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.body.name) throw httpError(400, 'name is required');
    const data = pickWritable(req.body);
    const keys = Object.keys(data);
    const [result] = await pool.query(
      `INSERT INTO \`equipment\` (\`user_id\`${keys.length ? `, ${keys.map((k) => '`' + k + '`').join(', ')}` : ''}) VALUES (?${
        keys.length ? `, ${keys.map(() => '?').join(', ')}` : ''
      })`,
      [req.user.id, ...keys.map((k) => data[k])]
    );
    const [rows] = await pool.query('SELECT * FROM `equipment` WHERE `id` = ?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  })
);

// GET /api/equipment/photo/:filename -> inline image (auth'd, like file streams)
router.get(
  '/photo/:filename',
  asyncHandler(async (req, res) => {
    const filename = path.basename(req.params.filename || '');
    const abs = path.join(PHOTO_DIR, filename);
    if (!filename || !abs.startsWith(PHOTO_DIR + path.sep)) throw httpError(400, 'Invalid photo path');
    res.sendFile(abs, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: { message: 'Photo not found' } });
      }
    });
  })
);

// GET /api/equipment/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM `equipment` WHERE `id` = ?', [req.params.id]);
    if (!rows.length) throw httpError(404, 'Equipment not found');
    res.json({ data: rows[0] });
  })
);

// PUT /api/equipment/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = pickWritable(req.body);
    const keys = Object.keys(data);
    if (!keys.length) throw httpError(400, 'No valid fields to update');
    const [result] = await pool.query(
      `UPDATE \`equipment\` SET ${keys.map((k) => '`' + k + '` = ?').join(', ')} WHERE \`id\` = ?`,
      [...keys.map((k) => data[k]), req.params.id]
    );
    if (!result.affectedRows) throw httpError(404, 'Equipment not found');
    const [rows] = await pool.query('SELECT * FROM `equipment` WHERE `id` = ?', [req.params.id]);
    res.json({ data: rows[0] });
  })
);

// DELETE /api/equipment/:id -> also removes the photo from disk
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT `photo` FROM `equipment` WHERE `id` = ?', [req.params.id]);
    if (!rows.length) throw httpError(404, 'Equipment not found');
    await pool.query('DELETE FROM `equipment` WHERE `id` = ?', [req.params.id]);
    await removePhotoFile(rows[0].photo);
    res.json({ data: { deleted: true } });
  })
);

// POST /api/equipment/:id/photo (multipart/form-data: photo) -> { data: {...updated} }
// Replaces the previous photo (old file deleted from disk).
router.post(
  '/:id/photo',
  photoUpload.single('photo'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, 'No photo uploaded (field name must be "photo")');
    const [rows] = await pool.query('SELECT `photo` FROM `equipment` WHERE `id` = ?', [req.params.id]);
    if (!rows.length) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      throw httpError(404, 'Equipment not found');
    }
    await removePhotoFile(rows[0].photo);
    await pool.query('UPDATE `equipment` SET `photo` = ? WHERE `id` = ?', [req.file.filename, req.params.id]);
    const [updated] = await pool.query('SELECT * FROM `equipment` WHERE `id` = ?', [req.params.id]);
    res.json({ data: updated[0] });
  })
);

// DELETE /api/equipment/:id/photo -> removes the photo
router.delete(
  '/:id/photo',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT `photo` FROM `equipment` WHERE `id` = ?', [req.params.id]);
    if (!rows.length) throw httpError(404, 'Equipment not found');
    await removePhotoFile(rows[0].photo);
    await pool.query('UPDATE `equipment` SET `photo` = NULL WHERE `id` = ?', [req.params.id]);
    res.json({ data: { deleted: true } });
  })
);

module.exports = router;
