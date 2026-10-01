const express = require('express');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { httpError } = require('../utils/crud');

const router = express.Router();

const WRITABLE = ['name', 'company', 'email', 'phone', 'notes'];

// GET /api/clients -> enriched list: project count, revenue, outstanding, last project
// Shared workspace: no per-user filtering — both teammates see everything.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM \`projects\` p WHERE p.\`client_id\` = c.\`id\`) AS projects_count,
         COALESCE((SELECT SUM(pay.\`amount\`) FROM \`payments\` pay
                   JOIN \`projects\` p ON p.\`id\` = pay.\`project_id\`
                   WHERE p.\`client_id\` = c.\`id\` AND pay.\`status\` = 'paid'), 0) AS total_revenue,
         GREATEST(0,
           COALESCE((SELECT SUM(p.\`price\`) FROM \`projects\` p WHERE p.\`client_id\` = c.\`id\`), 0)
           - COALESCE((SELECT SUM(pay.\`amount\`) FROM \`payments\` pay
                       JOIN \`projects\` p ON p.\`id\` = pay.\`project_id\`
                       WHERE p.\`client_id\` = c.\`id\` AND pay.\`status\` = 'paid'), 0)
         ) AS outstanding,
         (SELECT p.\`name\` FROM \`projects\` p
          WHERE p.\`client_id\` = c.\`id\`
          ORDER BY p.\`created_at\` DESC, p.\`id\` DESC LIMIT 1) AS last_project
       FROM \`clients\` c
       ORDER BY c.\`name\` ASC, c.\`id\` DESC`
    );
    res.json({ data: rows });
  })
);

// POST /api/clients -> create (user_id written as audit only — rows are shared)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (b.name === undefined || b.name === null || b.name === '') {
      throw httpError(400, 'name is required');
    }
    const cols = WRITABLE.filter((f) => Object.prototype.hasOwnProperty.call(b, f) && b[f] !== undefined);
    const insertCols = cols.length ? `, ${cols.map((c) => `\`${c}\``).join(', ')}` : '';
    const placeholders = cols.map(() => '?').join(', ');
    const values = [req.user.id, ...cols.map((c) => b[c])];

    const [result] = await pool.query(
      `INSERT INTO \`clients\` (\`user_id\`${insertCols}) VALUES (?${cols.length ? `, ${placeholders}` : ''})`,
      values
    );
    const [rows] = await pool.query('SELECT * FROM `clients` WHERE `id` = ?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  })
);

// GET /api/clients/:id -> client + their projects with paid/expense totals
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM `clients` WHERE `id` = ?', [req.params.id]);
    if (!rows.length) throw httpError(404, 'Client not found');
    const [projects] = await pool.query(
      `SELECT p.\`id\`, p.\`name\`, p.\`type\`, p.\`status\`, p.\`price\`, p.\`start_date\`,
         COALESCE((SELECT SUM(\`amount\`) FROM \`payments\` pay WHERE pay.\`project_id\` = p.\`id\` AND pay.\`status\` = 'paid'), p.\`paid\`, 0) AS paid_total,
         COALESCE((SELECT SUM(\`amount\`) FROM \`expenses\` e WHERE e.\`project_id\` = p.\`id\`), 0) AS expenses_total
       FROM \`projects\` p
       WHERE p.\`client_id\` = ?
       ORDER BY p.\`created_at\` DESC, p.\`id\` DESC`,
      [req.params.id]
    );
    res.json({ data: { ...rows[0], projects } });
  })
);

// PUT /api/clients/:id -> update
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const cols = WRITABLE.filter((f) => Object.prototype.hasOwnProperty.call(b, f) && b[f] !== undefined);
    if (!cols.length) throw httpError(400, 'No valid fields to update');

    const [result] = await pool.query(
      `UPDATE \`clients\` SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE \`id\` = ?`,
      [...cols.map((c) => b[c]), req.params.id]
    );
    if (!result.affectedRows) throw httpError(404, 'Client not found');

    const [rows] = await pool.query('SELECT * FROM `clients` WHERE `id` = ?', [req.params.id]);
    res.json({ data: rows[0] });
  })
);

// DELETE /api/clients/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM `clients` WHERE `id` = ?', [req.params.id]);
    if (!result.affectedRows) throw httpError(404, 'Client not found');
    res.json({ data: { deleted: true } });
  })
);

module.exports = router;
