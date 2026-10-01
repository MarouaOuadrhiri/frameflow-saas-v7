const { makeCrud } = require('../utils/crud');

module.exports = makeCrud({
  table: 'tasks',
  resourceName: 'Task',
  writable: ['project_id', 'title', 'column', 'priority'],
  required: ['title'],
  filters: { project_id: 'project_id', column: 'column' },
  orderBy: '`id` ASC',
});
