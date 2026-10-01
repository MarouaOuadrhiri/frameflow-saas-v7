'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n';
import { useToast } from './Toast';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];

export default function KanbanBoard({ tasks, onChange, projectId = null, showProject = false, projects = [] }) {
  const { t } = useLang();
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const colLabels = {
    'To Do': t('projectDetail.toDo'),
    'In Progress': t('projectDetail.inProgress'),
    Review: t('projectDetail.review'),
    Done: t('projectDetail.done')
  };

  const moveTask = async (task, column) => {
    const prev = task.column || task.status || 'To Do';
    if (!column || column === prev) return;
    onChange(tasks.map((x) => (x.id === task.id ? { ...x, column, status: column } : x)));
    try {
      await api.put(`/api/tasks/${task.id}`, { column });
    } catch (err) {
      onChange(tasks.map((x) => (x.id === task.id ? { ...x, column: prev, status: prev } : x)));
      toast(err.message, 'warn');
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || '';

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(task.id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDragLeave = (e, col) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol((prev) => (prev === col ? null : prev));
    }
  };

  const handleDrop = (e, col) => {
    e.preventDefault();
    setDragOverCol(null);
    const idStr = e.dataTransfer.getData('text/plain');
    const id = idStr ? Number(idStr) : draggedId;
    setDraggedId(null);
    if (id) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        moveTask(task, col);
      }
    }
  };

  return (
    <div className="kanban">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((x) => (x.column || x.status || 'To Do') === col);
        const isOver = dragOverCol === col;

        return (
          <div
            key={col}
            className={`kanban-col ${isOver ? 'is-drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col)}
            onDragEnter={(e) => handleDragOver(e, col)}
            onDragLeave={(e) => handleDragLeave(e, col)}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="kanban-col-head">
              <span className="kanban-col-title">{colLabels[col]}</span>
              <span className="kanban-col-count">{colTasks.length}</span>
            </div>
            <div className={`kanban-cards ${isOver ? 'is-drag-over' : ''}`}>
              {colTasks.map((task) => {
                const isDragging = draggedId === task.id;
                return (
                  <div
                    key={task.id}
                    className={`task-card ${isDragging ? 'is-dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-card-title">{task.title}</div>
                    {showProject && task.project_id && (
                      <div className="task-card-project muted">{projectName(task.project_id)}</div>
                    )}
                    <div className="task-card-foot">
                      <span className={`priority-badge ${(task.priority || 'normal').toLowerCase()}`}>
                        {task.priority || t('common.normal')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="kanban-empty">{t('tasks.emptyColumn')}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
