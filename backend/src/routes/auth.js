const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const { httpError } = require('../utils/crud');

const router = express.Router();

const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  initials: row.initials,
  created_at: row.created_at,
});

const JWT_SECRET = process.env.JWT_SECRET || 'lh4fcvytpChdk31YVBJeRJW8UhYU6o6JSJfXWn713n2dlFhb';

const signToken = (user) =>
  jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register — DISABLED (single-admin mode).
// This SaaS has exactly one admin login (the studio owner). There is no
// public sign-up; clients of the studio never log in — they are simple
// CRM records under /clients. Create the admin account with:
//   npm run create-admin -- "Full Name" admin@studio.com secret123
router.post('/register', (req, res) => {
  res.status(403).json({
    error: { message: 'Public registration is disabled. Ask the studio administrator for access.' },
  });
});

// POST /api/auth/login  { email, password } -> { data: { user, token } }
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw httpError(400, 'email and password are required');
    }

    const [rows] = await pool.query('SELECT * FROM `users` WHERE `email` = ?', [email]);
    const row = rows[0];
    if (!row) {
      throw httpError(401, 'Invalid email or password');
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      throw httpError(401, 'Invalid email or password');
    }

    const user = publicUser(row);
    res.json({ data: { user, token: signToken(user) } });
  })
);

// GET /api/auth/me -> { data: { user } }
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM `users` WHERE `id` = ?', [req.user.id]);
    if (!rows.length) {
      throw httpError(401, 'User not found');
    }
    res.json({ data: { user: publicUser(rows[0]) } });
  })
);

module.exports = router;
