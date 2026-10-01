const { makeCrud } = require('../utils/crud');

module.exports = makeCrud({
  table: 'calendar_events',
  resourceName: 'Event',
  writable: ['project_id', 'title', 'date', 'time', 'color', 'kind'],
  required: ['title', 'date'],
  filters: { project_id: 'project_id', month: { type: 'month', column: 'date' } },
  orderBy: '`date` ASC, `id` ASC',
});
