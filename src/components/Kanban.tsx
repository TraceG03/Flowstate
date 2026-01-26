import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { TaskStatus, Priority } from '../types';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

export default function Kanban() {
  const { state, addTask, updateTask } = useApp();
  const { tasks, tags } = state;

  const [showModal, setShowModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    status: 'todo' as TaskStatus,
    tags: [] as string[],
    dueDate: '',
    color: '#6366f1',
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    const task = tasks.find(t => t.id === draggedTask);
    if (!task) return;

    updateTask({
      ...task,
      status: columnId,
      completedAt: columnId === 'done' ? new Date().toISOString() : null,
    });

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    addTask({
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      tags: newTask.tags,
      dueDate: newTask.dueDate || null,
      startDate: null,
      endDate: null,
      projectId: null,
      completedAt: null,
      assignee: null,
      color: newTask.color,
    });

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      tags: [],
      dueDate: '',
      color: '#6366f1',
    });
    setShowModal(false);
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  return (
    <>
      <Header title="Kanban Board" onAddClick={() => setShowModal(true)} />
      <div className="content">
        <div className="kanban-board">
          {columns.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            const isOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className="kanban-column"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                style={{
                  borderColor: isOver ? column.color : undefined,
                  boxShadow: isOver ? `0 0 20px ${column.color}40` : undefined,
                }}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: column.color,
                      }}
                    />
                    {column.title}
                  </div>
                  <span className="kanban-column-count">{columnTasks.length}</span>
                </div>

                <div className="kanban-column-tasks">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      className="kanban-task"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      style={{
                        opacity: draggedTask === task.id ? 0.5 : 1,
                      }}
                    >
                      <div
                        className="kanban-task-color"
                        style={{ background: task.color }}
                      />
                      <h4>{task.title}</h4>
                      {task.description && (
                        <p>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>
                      )}
                      <div className="kanban-task-footer">
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-sm text-muted">
                            <Calendar size={12} />
                            {format(parseISO(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {task.tags.slice(0, 2).map(tagId => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <span
                                key={tag.id}
                                className="tag"
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderColor: tag.color,
                                  color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      opacity: 0.7,
                    }}
                    onClick={() => {
                      setNewTask(prev => ({ ...prev, status: column.id }));
                      setShowModal(true);
                    }}
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <Modal title="Add Task" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Task Title</label>
              <input
                type="text"
                className="input"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="Add details..."
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select
                  className="input"
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as Priority }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select
                  className="input"
                  value={newTask.status}
                  onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Due Date</label>
              <input
                type="date"
                className="input"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTask(prev => ({ ...prev, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: newTask.color === color ? '3px solid white' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                Add Task
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
