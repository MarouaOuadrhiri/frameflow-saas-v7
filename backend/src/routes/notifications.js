const express = require('express');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { httpError } = require('../utils/crud');

const router = express.Router();

// GET /api/notifications -> newest first
// Also auto-generates "1 hour before" reminders for upcoming calendar events.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Events starting within the next hour (or today, when no time is set),
    // that don't already have a reminder notification.
    const [upcoming] = await pool.query(
      `SELECT e.\`id\`, e.\`title\`, e.\`date\`, e.\`time\`
       FROM \`calendar_events\` e
       LEFT JOIN \`notifications\` n ON n.\`event_id\` = e.\`id\`
       WHERE n.\`id\` IS NULL
         AND (
           (e.\`time\` IS NOT NULL AND TIMESTAMP(e.\`date\`, e.\`time\`) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR))
           OR (e.\`time\` IS NULL AND e.\`date\` = CURDATE())
         )`
    );
    for (const ev of upcoming) {
      const when = ev.time ? `at ${String(ev.time).slice(0, 5)}` : 'today';
      const text = `Reminder: "${ev.title}" starts ${when} — in less than 1 hour.`;
      await pool.query(
        'INSERT INTO `notifications` (`user_id`, `icon`, `color`, `text`, `event_id`) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'calendar', 'warning', text, ev.id]
      );
    }

    // Projects whose deadline is tomorrow (1 day left) and that don't
    // already have a reminder notification.
    const [dueTomorrow] = await pool.query(
      `SELECT p.\`id\`, p.\`name\`, p.\`deadline\`
       FROM \`projects\` p
       LEFT JOIN \`notifications\` n ON n.\`project_id\` = p.\`id\`
       WHERE n.\`id\` IS NULL
         AND p.\`deadline\` = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND p.\`status\` NOT IN ('completed', 'archived')`
    );
    for (const pr of dueTomorrow) {
      const date = pr.deadline instanceof Date ? pr.deadline.toISOString().slice(0, 10) : String(pr.deadline).slice(0, 10);
      const text = `Deadline tomorrow: "${pr.name}" is due ${date}.`;
      await pool.query(
        'INSERT INTO `notifications` (`user_id`, `icon`, `color`, `text`, `project_id`) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'calendar', 'warning', text, pr.id]
      );
    }

    const [rows] = await pool.query(
      'SELECT `id`, `icon`, `color`, `text`, `is_read`, `created_at` FROM `notifications` ORDER BY `created_at` DESC, `id` DESC'
    );
    res.json({ data: rows.map((n) => ({ ...n, is_read: Boolean(n.is_read) })) });
  })
);

// PUT /api/notifications/read-all  (must be declared before /:id/read)
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('UPDATE `notifications` SET `is_read` = 1 WHERE `is_read` = 0');
    res.json({ data: { read: result.affectedRows } });
  })
);

// PUT /api/notifications/:id/read
router.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('UPDATE `notifications` SET `is_read` = 1 WHERE `id` = ?', [req.params.id]);
    if (!result.affectedRows) throw httpError(404, 'Notification not found');
    res.json({ data: { id: Number(req.params.id), is_read: true } });
  })
);

module.exports = router;
