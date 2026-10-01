const express = require('express');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const col = (name) => '`' + String(name).replace(/`/g, '') + '`';

/**
 * Builds a CRUD router implementing the FrameFlow API contract:
 *   GET    /          -> { data: [...] }            (optional query filters)
 *   POST   /          -> { data: {...created} } 201 (required-field validation -> 400)
 *   GET    /:id       -> { data: {...} }           (404 when missing)
 *   PUT    /:id       -> { data: {...updated} }
 *   DELETE /:id       -> { data: { deleted: true } }
 *
 * FrameFlow runs as a shared workspace: both teammates log in and see/edit
 * EVERYTHING. No per-user filtering — `user_id` is written on INSERT only,
 * as an audit trail of who created each row.
 *
 * options:
 *   table        - MySQL table name
 *   resourceName - singular label used in 404/validation messages
 *   writable     - body fields allowed on create/update
 *   required     - body fields required on create (400 when missing/empty)
 *   filters      - { queryParam: columnName } or
 *                  { queryParam: { type: 'month', column: 'date' } } for ?month=YYYY-MM
 *   orderBy      - ORDER BY clause for the list endpoint
 *   hooks        - { afterUpdate?: async ({ req, row, prev, pool, httpError }) => ... }
 *                  afterUpdate may return { data } to replace the response body,
 *                  or { response } to replace the whole JSON response.
 */
function makeCrud({ table, resourceName, writable = [], required = [], filters = {}, orderBy = 'id DESC', hooks = {} }) {
  const router = express.Router();
  const name = resourceName || table;

  const pickWritable = (body = {}) => {
    const out = {};
    for (const f of writable) {
      if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== undefined) {
        out[f] = body[f];
      }
    }
    return out;
  };

  // LIST (shared workspace: no per-user filtering)
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const conds = [];
      const params = [];

      for (const [param, def] of Object.entries(filters)) {
        const value = req.query[param];
        if (value === undefined || value === '') continue;
        if (def && typeof def === 'object' && def.type === 'month') {
          conds.push(`DATE_FORMAT(${col(def.column)}, '%Y-%m') = ?`);
          params.push(value);
        } else {
          conds.push(`${col(def)} = ?`);
          params.push(value);
        }
      }

      const [rows] = await pool.query(
        `SELECT * FROM ${col(table)}${conds.length ? ` WHERE ${conds.join(' AND ')}` : ''} ORDER BY ${orderBy}`,
        params
      );
      res.json({ data: rows });
    })
  );

  // CREATE (writes user_id as audit trail only — rows are shared)
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      for (const field of required) {
        const value = req.body[field];
        if (value === undefined || value === null || value === '') {
          throw httpError(400, `${field} is required`);
        }
      }
      const data = pickWritable(req.body);
      const keys = Object.keys(data);
      const insertCols = keys.length ? `, ${keys.map(col).join(', ')}` : '';
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.length ? [req.user.id, ...keys.map((k) => data[k])] : [req.user.id];

      const [result] = await pool.query(
        `INSERT INTO ${col(table)} (\`user_id\`${insertCols}) VALUES (?${keys.length ? `, ${placeholders}` : ''})`,
        values
      );
      const [rows] = await pool.query(`SELECT * FROM ${col(table)} WHERE \`id\` = ?`, [result.insertId]);
      res.status(201).json({ data: rows[0] });
    })
  );

  // GET ONE
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const [rows] = await pool.query(`SELECT * FROM ${col(table)} WHERE \`id\` = ?`, [req.params.id]);
      if (!rows.length) throw httpError(404, `${name} not found`);
      res.json({ data: rows[0] });
    })
  );

  // UPDATE
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const data = pickWritable(req.body);
      const keys = Object.keys(data);
      if (!keys.length) throw httpError(400, 'No valid fields to update');

      let prev = null;
      if (hooks.afterUpdate) {
        const [p] = await pool.query(`SELECT * FROM ${col(table)} WHERE \`id\` = ?`, [req.params.id]);
        prev = p[0] || null;
      }

      const [result] = await pool.query(
        `UPDATE ${col(table)} SET ${keys.map((k) => `${col(k)} = ?`).join(', ')} WHERE \`id\` = ?`,
        [...keys.map((k) => data[k]), req.params.id]
      );
      if (!result.affectedRows) throw httpError(404, `${name} not found`);

      const [rows] = await pool.query(`SELECT * FROM ${col(table)} WHERE \`id\` = ?`, [req.params.id]);
      const row = rows[0] || null;

      if (hooks.afterUpdate) {
        const hookRes = await hooks.afterUpdate({ req, row, prev, pool, httpError });
        if (hookRes && hookRes.response) return res.json(hookRes.response);
        if (hookRes && hookRes.data) return res.json({ data: hookRes.data });
      }
      res.json({ data: row });
    })
  );

  // DELETE
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const [result] = await pool.query(`DELETE FROM ${col(table)} WHERE \`id\` = ?`, [req.params.id]);
      if (!result.affectedRows) throw httpError(404, `${name} not found`);
      res.json({ data: { deleted: true } });
    })
  );

  return router;
}

module.exports = { makeCrud, httpError };
