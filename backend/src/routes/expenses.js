const { makeCrud } = require('../utils/crud');

module.exports = makeCrud({
  table: 'expenses',
  resourceName: 'Expense',
  writable: ['project_id', 'date', 'description', 'category', 'amount', 'payment_method', 'receipt'],
  required: ['project_id', 'description', 'amount'],
  filters: { project_id: 'project_id', month: { type: 'month', column: 'date' } },
  orderBy: '`date` DESC, `id` DESC',
});
