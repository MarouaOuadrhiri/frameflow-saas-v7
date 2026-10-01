const { makeCrud } = require('../utils/crud');

module.exports = makeCrud({
  table: 'payments',
  resourceName: 'Payment',
  writable: ['project_id', 'date', 'amount', 'method', 'notes', 'status'],
  required: ['project_id', 'amount'],
  filters: { project_id: 'project_id', month: { type: 'month', column: 'date' }, status: 'status' },
  orderBy: '`date` DESC, `id` DESC',
});
