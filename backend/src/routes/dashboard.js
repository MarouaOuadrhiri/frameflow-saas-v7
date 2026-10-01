const express = require('express');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/dashboard -> kpis, activeProjects (top 3), smartAlerts, damagedEquipment, timeline
// Shared workspace: both teammates see everything — no per-user filtering.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [kpiRows] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM \`projects\` WHERE \`status\` NOT IN ('completed', 'archived')) AS activeProjects,
         (SELECT COALESCE(SUM(\`price\`), 0) FROM \`projects\` WHERE \`status\` NOT IN ('completed', 'archived')) AS totalRevenue,
         (SELECT COALESCE(SUM(\`amount\`), 0) FROM \`expenses\` WHERE \`project_id\` IN (SELECT \`id\` FROM \`projects\` WHERE \`status\` NOT IN ('completed', 'archived'))) AS totalExpenses,
         (SELECT COALESCE(SUM(\`price\`), 0) FROM \`equipment\`) AS equipmentValue,
         (SELECT COUNT(*) FROM \`equipment\`) AS equipmentCount`
    );
    const kpi = kpiRows[0] || {};

    const totalRevenue = Number(kpi.totalRevenue);
    const totalExpenses = Number(kpi.totalExpenses);
    const netProfit = totalRevenue - totalExpenses;

    const [activeProjects] = await pool.query(
      `SELECT p.*, c.\`name\` AS client_name,
        COALESCE((SELECT SUM(\`amount\`) FROM \`expenses\` e WHERE e.\`project_id\` = p.\`id\`), 0) AS expenses_total,
        COALESCE((SELECT SUM(\`amount\`) FROM \`payments\` pay WHERE pay.\`project_id\` = p.\`id\` AND pay.\`status\` = 'paid'), p.\`paid\`, 0) AS paid_total,
        (SELECT COUNT(*) FROM \`project_equipment\` pe WHERE pe.\`project_id\` = p.\`id\`) AS equip_count
       FROM \`projects\` p
       LEFT JOIN \`clients\` c ON c.\`id\` = p.\`client_id\`
       WHERE p.\`status\` NOT IN ('completed', 'archived')
       ORDER BY p.\`deadline\` IS NULL, p.\`deadline\` ASC
       LIMIT 3`
    );

    const [damagedCountRows] = await pool.query('SELECT COUNT(*) AS n FROM `equipment` WHERE `damaged` = 1');
    const [damagedRows] = await pool.query(
      'SELECT `id`, `name`, `category` FROM `equipment` WHERE `damaged` = 1 ORDER BY `name` ASC LIMIT 10'
    );
    const damagedEquipment = {
      count: Number(damagedCountRows[0]?.n || 0),
      items: damagedRows,
    };

    const [timeline] = await pool.query(
      `SELECT e.*, p.\`name\` AS project_name
       FROM \`calendar_events\` e
       LEFT JOIN \`projects\` p ON p.\`id\` = e.\`project_id\`
       ORDER BY e.\`date\` ASC, e.\`id\` ASC
       LIMIT 6`
    );

    // Rule-based smart alerts derived from live data (max 4).
    const smartAlerts = [];

    const [gearRows] = await pool.query(
      `SELECT COUNT(*) AS n, GROUP_CONCAT(DISTINCT pr.\`name\` SEPARATOR ', ') AS projects
       FROM \`project_equipment\` pe
       JOIN \`projects\` pr ON pr.\`id\` = pe.\`project_id\`
       WHERE pe.\`status\` != 'ok'`
    );
    const gearAgg = gearRows[0] || { n: 0, projects: null };
    if (Number(gearAgg.n) > 0) {
      smartAlerts.push({
        icon: 'issues',
        color: 'danger',
        text: `${gearAgg.n} equipment item${gearAgg.n > 1 ? 's need' : ' needs'} attention (${gearAgg.projects}).`,
      });
    }

    const [pendingRows] = await pool.query(
      "SELECT COUNT(*) AS n, COALESCE(SUM(`amount`), 0) AS total FROM `payments` WHERE `status` = 'pending'"
    );
    const pendingAgg = pendingRows[0] || { n: 0, total: 0 };
    if (Number(pendingAgg.n) > 0) {
      smartAlerts.push({
        icon: 'payments',
        color: 'warning',
        text: `${pendingAgg.n} pending payment${pendingAgg.n > 1 ? 's' : ''} totalling ${Number(pendingAgg.total).toLocaleString('en-US').replace(/,/g, ' ')} DH.`,
      });
    }

    const [upcoming] = await pool.query(
      `SELECT \`name\`, \`deadline\` FROM \`projects\`
       WHERE \`status\` NOT IN ('completed', 'archived')
         AND \`deadline\` IS NOT NULL AND \`deadline\` <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY \`deadline\` ASC LIMIT 2`
    );
    for (const p of upcoming) {
      smartAlerts.push({
        icon: 'calendar',
        color: 'warning',
        text: `${p.name} deadline is ${p.deadline}.`,
      });
    }

    const [damagedAlertRows] = await pool.query(
      "SELECT COUNT(*) AS n FROM `equipment` WHERE `damaged` = 1"
    );
    const damagedAgg = damagedAlertRows[0] || { n: 0 };
    if (Number(damagedAgg.n) > 0) {
      smartAlerts.push({
        icon: 'equipment',
        color: 'danger',
        text: `${damagedAgg.n} gear item${damagedAgg.n > 1 ? 's are' : ' is'} damaged.`,
      });
    }

    // Last 6 calendar months (oldest -> newest) with revenue/expenses/profit from live data.
    const [monthlyRows] = await pool.query(
      `SELECT DATE_FORMAT(m.m, '%Y-%m') AS \`month\`, DATE_FORMAT(m.m, '%b') AS \`label\`,
         COALESCE((SELECT SUM(\`amount\`) FROM \`payments\`
                   WHERE \`status\` = 'paid' AND DATE_FORMAT(\`date\`, '%Y-%m') = DATE_FORMAT(m.m, '%Y-%m')), 0) AS revenue,
         COALESCE((SELECT SUM(\`amount\`) FROM \`expenses\`
                   WHERE DATE_FORMAT(\`date\`, '%Y-%m') = DATE_FORMAT(m.m, '%Y-%m')), 0) AS expenses
       FROM (
         SELECT DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AS m UNION ALL
         SELECT DATE_SUB(CURDATE(), INTERVAL 4 MONTH) UNION ALL
         SELECT DATE_SUB(CURDATE(), INTERVAL 3 MONTH) UNION ALL
         SELECT DATE_SUB(CURDATE(), INTERVAL 2 MONTH) UNION ALL
         SELECT DATE_SUB(CURDATE(), INTERVAL 1 MONTH) UNION ALL
         SELECT CURDATE()
       ) m
       ORDER BY m.m ASC`
    );
    const monthly = monthlyRows.map((r) => ({
      month: r.month,
      label: r.label,
      revenue: Number(r.revenue),
      expenses: Number(r.expenses),
      profit: Number(r.revenue) - Number(r.expenses),
    }));

    const [expensesByCategory] = await pool.query(
      'SELECT `category` AS `label`, COALESCE(SUM(`amount`), 0) AS `value` FROM `expenses` GROUP BY `category` ORDER BY `value` DESC'
    );
    const expCatRows = expensesByCategory.map((r) => ({ label: r.label, value: Number(r.value) }));

    res.json({
      data: {
        kpis: {
          activeProjects: Number(kpi.activeProjects),
          totalRevenue,
          totalExpenses,
          netProfit,
          margin: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0,
          equipmentValue: Number(kpi.equipmentValue),
          equipmentCount: Number(kpi.equipmentCount),
        },
        activeProjects,
        smartAlerts: smartAlerts.slice(0, 4),
        damagedEquipment,
        timeline,
        monthly,
        expensesByCategory: expCatRows,
      },
    });
  })
);

// GET /api/dashboard/series?days=30 -> daily revenue/expenses for the last N days (max 90)
router.get(
  '/series',
  asyncHandler(async (req, res) => {
    const n = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 90);
    const [rows] = await pool.query(
      `SELECT DATE(\`date\`) AS d, 'revenue' AS kind, SUM(\`amount\`) AS total
       FROM \`payments\`
       WHERE \`status\` = 'paid' AND \`date\` >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(\`date\`)
       UNION ALL
       SELECT DATE(\`date\`) AS d, 'expenses' AS kind, SUM(\`amount\`) AS total
       FROM \`expenses\`
       WHERE \`date\` >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(\`date\`)`,
      [n, n]
    );
    const byDay = {};
    for (const r of rows) {
      const key = String(r.d).slice(0, 10);
      if (!byDay[key]) byDay[key] = { revenue: 0, expenses: 0 };
      byDay[key][r.kind] = Number(r.total);
    }
    const labels = [];
    const revenue = [];
    const expenses = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(`D${n - i}`);
      revenue.push(byDay[key] ? byDay[key].revenue : 0);
      expenses.push(byDay[key] ? byDay[key].expenses : 0);
    }
    res.json({ data: { labels, revenue, expenses } });
  })
);

module.exports = router;
