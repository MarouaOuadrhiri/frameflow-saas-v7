const { makeCrud } = require('../utils/crud');

module.exports = makeCrud({
  table: 'purchase_items',
  resourceName: 'Purchase item',
  writable: ['project_id', 'item', 'category', 'qty', 'est_price', 'priority', 'status'],
  required: ['item'],
  filters: { status: 'status', project_id: 'project_id' },
  orderBy: '`id` DESC',
  hooks: {
    // When an item's status becomes "Received", it leaves the purchase list
    // and joins the equipment inventory (transactional: insert + delete).
    afterUpdate: async ({ row, prev, pool }) => {
      if (!row || row.status !== 'Received' || (prev && prev.status === 'Received')) return null;
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const qty = Math.max(1, Number(row.qty) || 1);
        const name = qty > 1 ? `${row.item} (x${qty})` : row.item;
        const [ins] = await conn.query(
          'INSERT INTO `equipment` (`user_id`, `name`, `category`, `price`, `purchase_date`) VALUES (?, ?, ?, ?, CURDATE())',
          [row.user_id, name, row.category || '', Number(row.est_price) || 0]
        );
        await conn.query('DELETE FROM `purchase_items` WHERE `id` = ?', [row.id]);
        await conn.commit();
        const [erows] = await pool.query('SELECT * FROM `equipment` WHERE `id` = ?', [ins.insertId]);
        return { response: { data: { converted: true, deleted: true, equipment: erows[0] || null } } };
      } catch (e) {
        try {
          await conn.rollback();
        } catch {
          // ignore rollback errors
        }
        throw e;
      } finally {
        conn.release();
      }
    },
  },
});
