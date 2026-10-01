const express = require('express');
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { makeCrud, httpError } = require('../utils/crud');

const router = express.Router();

// GET /api/projects -> enriched list: client name, expense/payment totals, equipment count
// Shared workspace: no per-user filtering — both teammates see everything.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.status) {
      where.push('p.`status` = ?');
      params.push(req.query.status);
    }
    const [rows] = await pool.query(
      `SELECT p.*, c.\`name\` AS client_name,
        COALESCE((SELECT SUM(\`amount\`) FROM \`expenses\` e WHERE e.\`project_id\` = p.\`id\`), 0) AS expenses_total,
        COALESCE((SELECT SUM(\`amount\`) FROM \`payments\` pay WHERE pay.\`project_id\` = p.\`id\` AND pay.\`status\` = 'paid'), p.\`paid\`, 0) AS paid_total,
        (SELECT COUNT(*) FROM \`project_equipment\` pe WHERE pe.\`project_id\` = p.\`id\`) AS equip_count
       FROM \`projects\` p
       LEFT JOIN \`clients\` c ON c.\`id\` = p.\`client_id\`
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY p.\`created_at\` DESC, p.\`id\` DESC`,
      params
    );

    res.json({ data: rows });
  })
);

// POST /api/projects -> create project + optional equipment_ids[], tasks[], initial deposit, initial expenses
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const b = req.body || {};
    if (!b.name) throw httpError(400, 'name is required');

    const projectPrice = Number(b.price) || Number(b.budget) || 0;
    const depositAmount = Number(b.deposit ?? b.paid) || 0;
    const estimatedExpenses = Number(b.estimated_expenses ?? b.expenses) || 0;
    const startDate = b.start_date || null;
    const initialDate = startDate ? String(startDate).slice(0, 10) : new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO \`projects\`
        (\`user_id\`, \`client_id\`, \`name\`, \`type\`, \`status\`, \`thumb\`, \`deadline\`, \`start_date\`, \`location\`, \`description\`, \`production_notes\`, \`price\`, \`paid\`, \`progress\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        b.client_id || null,
        b.name,
        b.type || 'Production',
        b.status || 'planning',
        b.thumb || null,
        b.deadline || null,
        startDate,
        b.location || null,
        b.description || null,
        b.production_notes || null,
        projectPrice,
        depositAmount,
        Number(b.progress) || 0,
      ]
    );
    const projectId = result.insertId;

    // Create payment entry if deposit is provided
    if (depositAmount > 0) {
      await pool.query(
        'INSERT INTO `payments` (`user_id`, `project_id`, `date`, `amount`, `method`, `notes`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, projectId, initialDate, depositAmount, 'Bank transfer', 'Deposit', 'paid']
      );
    }

    // Create initial expense entry if estimated expenses are provided
    if (estimatedExpenses > 0) {
      await pool.query(
        'INSERT INTO `expenses` (`user_id`, `project_id`, `date`, `description`, `category`, `amount`, `payment_method`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, projectId, initialDate, 'Estimated expenses', 'Production', estimatedExpenses, 'Other']
      );
    }

    if (Array.isArray(b.equipment_ids) && b.equipment_ids.length) {
      const ids = b.equipment_ids.map(Number).filter(Boolean);
      if (ids.length) {
        const [eqs] = await pool.query('SELECT `id`, `name` FROM `equipment` WHERE `id` IN (?)', [ids]);
        for (const e of eqs) {
          await pool.query(
            'INSERT INTO `project_equipment` (`project_id`, `equipment_id`, `item_name`, `status`) VALUES (?, ?, ?, ?)',
            [projectId, e.id, e.name, 'ok']
          );
        }
      }
    }

    // Optional initial tasks: [{ title, priority?, column? }] or ['title', ...]
    if (Array.isArray(b.tasks) && b.tasks.length) {
      for (const t of b.tasks) {
        const title = (typeof t === 'string' ? t : t && t.title || '').trim();
        if (!title) continue;
        const col = typeof t === 'object' && ['To Do', 'In Progress', 'Review', 'Done'].includes(t.column) ? t.column : 'To Do';
        const prio = typeof t === 'object' && ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium';
        await pool.query(
          'INSERT INTO `tasks` (`user_id`, `project_id`, `title`, `column`, `priority`) VALUES (?, ?, ?, ?, ?)',
          [userId, projectId, title, col, prio]
        );
      }
    }

    const [rows] = await pool.query('SELECT * FROM `projects` WHERE `id` = ?', [projectId]);
    res.status(201).json({ data: rows[0] });
  })
);

// Standard CRUD for the rest: PUT /:id, DELETE /:id
// (list + create are overridden above)
// GET /:id is overridden below to include client_name.
const crudRouter = makeCrud({
    table: 'projects',
    resourceName: 'Project',
    writable: [
      'client_id',
      'name',
      'type',
      'status',
      'thumb',
      'deadline',
      'start_date',
      'location',
      'description',
      'production_notes',
      'price',
      'paid',
      'progress',
    ],
    required: ['name'],
    filters: { status: 'status' },
    orderBy: '`created_at` DESC, `id` DESC',
  }
);
// GET /api/projects/:id -> project detail with client_name (before crudRouter so it wins)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT p.*, c.`name` AS client_name FROM `projects` p LEFT JOIN `clients` c ON c.`id` = p.`client_id` WHERE p.`id` = ?',
      [req.params.id]
    );
    if (!rows.length) throw httpError(404, 'Project not found');
    res.json({ data: rows[0] });
  })
);

// POST /api/projects/:id/done -> mark project as completed (or toggle back to production)
router.post(
  '/:id/done',
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const [rows] = await pool.query('SELECT * FROM `projects` WHERE `id` = ?', [projectId]);
    if (!rows.length) throw httpError(404, 'Project not found');
    const project = rows[0];

    const isDone = project.status === 'completed';
    const newStatus = isDone ? 'production' : 'completed';
    const newProgress = isDone ? (Number(project.progress) >= 100 ? 75 : Number(project.progress)) : 100;

    await pool.query(
      'UPDATE `projects` SET `status` = ?, `progress` = ? WHERE `id` = ?',
      [newStatus, newProgress, projectId]
    );

    const [updated] = await pool.query(
      'SELECT p.*, c.`name` AS client_name FROM `projects` p LEFT JOIN `clients` c ON c.`id` = p.`client_id` WHERE p.`id` = ?',
      [projectId]
    );
    res.json({ data: updated[0] });
  })
);

router.use(crudRouter);

// GET /api/projects/:id/summary -> budget, expenses, profit, payments, progress
router.get(
  '/:id/summary',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM `projects` WHERE `id` = ?', [req.params.id]);
    if (!rows.length) throw httpError(404, 'Project not found');
    const project = rows[0];

    const [expRows] = await pool.query(
      'SELECT COALESCE(SUM(`amount`), 0) AS total FROM `expenses` WHERE `project_id` = ?',
      [project.id]
    );
    const [payRows] = await pool.query(
      "SELECT COALESCE(SUM(`amount`), 0) AS total FROM `payments` WHERE `project_id` = ? AND `status` = 'paid'",
      [project.id]
    );
    const expAgg = expRows[0] || { total: 0 };
    const payAgg = payRows[0] || { total: 0 };
    const [expenses] = await pool.query(
      'SELECT * FROM `expenses` WHERE `project_id` = ? ORDER BY `date` DESC, `id` DESC',
      [project.id]
    );
    const [payments] = await pool.query(
      'SELECT * FROM `payments` WHERE `project_id` = ? ORDER BY `date` DESC, `id` DESC',
      [project.id]
    );
    const [gear] = await pool.query(
      `SELECT pe.*, e.\`name\` AS equip_name, e.\`brand\` AS equip_brand, e.\`photo\` AS equip_photo,
              e.\`category\` AS equip_category, e.\`price\` AS equip_price, e.\`damaged\` AS equip_damaged
       FROM \`project_equipment\` pe
       LEFT JOIN \`equipment\` e ON e.\`id\` = pe.\`equipment_id\`
       WHERE pe.\`project_id\` = ? ORDER BY pe.\`id\` ASC`,
      [project.id]
    );

    const budget = Number(project.price) || 0;
    const expensesTotal = Number(expAgg.total) || 0;
    const paidSum = Number(payAgg.total) || 0;
    const paid = paidSum > 0 || payments.length > 0 ? paidSum : (Number(project.paid) || 0);
    const profit = budget - expensesTotal;
    const margin = budget > 0 ? Number(((profit / budget) * 100).toFixed(1)) : 0;
    const remaining = Math.max(0, budget - paid);

    res.json({
      data: {
        budget,
        expensesTotal,
        profit,
        margin,
        paid,
        remaining,
        progress: Number(project.progress) || 0,
        expenses,
        payments,
        equipment: gear,
      },
    });
  })
);

// POST /api/projects/:id/equipment -> assign gear:
// Supports multiple items (equipment_ids array or items array) or single item (equipment_id / item_name).
router.post(
  '/:id/equipment',
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const [prows] = await pool.query('SELECT `id` FROM `projects` WHERE `id` = ?', [projectId]);
    if (!prows.length) throw httpError(404, 'Project not found');

    const b = req.body || {};
    const createdIds = [];

    // Case 1: Array of equipment IDs passed (e.g. { equipment_ids: [1, 2, 3] })
    if (Array.isArray(b.equipment_ids) && b.equipment_ids.length) {
      const ids = b.equipment_ids.map(Number).filter(Boolean);
      if (ids.length) {
        const [eqs] = await pool.query('SELECT `id`, `name`, `price` FROM `equipment` WHERE `id` IN (?)', [ids]);
        for (const e of eqs) {
          const [result] = await pool.query(
            'INSERT INTO `project_equipment` (`project_id`, `equipment_id`, `item_name`, `est_price`, `status`) VALUES (?, ?, ?, ?, ?)',
            [projectId, e.id, e.name, Number(e.price) || 0, 'ok']
          );
          createdIds.push(result.insertId);
        }
      }
    }
    // Case 2: Array of custom or mixed item objects (e.g. { items: [{ equipment_id: 1 }, { item_name: 'Crane' }] })
    else if (Array.isArray(b.items) && b.items.length) {
      for (const item of b.items) {
        const eqId = item.equipment_id ? Number(item.equipment_id) : null;
        let name = String(item.item_name || '').trim();
        let price = Number(item.est_price) || 0;
        if (eqId) {
          const [erows] = await pool.query('SELECT `id`, `name`, `price` FROM `equipment` WHERE `id` = ?', [eqId]);
          if (erows.length) {
            name = erows[0].name;
            if (!price) price = Number(erows[0].price) || 0;
          }
        }
        if (name) {
          const [result] = await pool.query(
            'INSERT INTO `project_equipment` (`project_id`, `equipment_id`, `item_name`, `est_price`, `status`) VALUES (?, ?, ?, ?, ?)',
            [projectId, eqId, name, price, 'ok']
          );
          createdIds.push(result.insertId);
        }
      }
    }
    // Case 3: Single item
    else {
      const { equipment_id, item_name, est_price } = b;
      const eqId = equipment_id ? Number(equipment_id) : null;
      let name = String(item_name || '').trim();
      let price = Number(est_price) || 0;
      if (eqId) {
        const [erows] = await pool.query('SELECT `id`, `name`, `price` FROM `equipment` WHERE `id` = ?', [eqId]);
        if (!erows.length) throw httpError(404, 'Equipment not found');
        name = erows[0].name;
        if (!price) price = Number(erows[0].price) || 0;
      } else if (!name) {
        throw httpError(400, 'equipment_id, equipment_ids or item_name is required');
      }
      const [result] = await pool.query(
        'INSERT INTO `project_equipment` (`project_id`, `equipment_id`, `item_name`, `est_price`, `status`) VALUES (?, ?, ?, ?, ?)',
        [projectId, eqId, name, price, 'ok']
      );
      createdIds.push(result.insertId);
    }

    res.status(201).json({ data: { count: createdIds.length, ids: createdIds } });
  })
);

// DELETE /api/projects/:id/equipment/:gearId -> unassign gear from the project
router.delete(
  '/:id/equipment/:gearId',
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM `project_equipment` WHERE `id` = ? AND `project_id` = ?', [
      req.params.gearId,
      req.params.id,
    ]);
    if (!result.affectedRows) throw httpError(404, 'Assigned equipment not found');
    res.json({ data: { deleted: true } });
  })
);

module.exports = router;
