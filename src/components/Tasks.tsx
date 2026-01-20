import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import {
  CheckCircle, Circle, Calendar, Tag, Flag, MoreHorizontal,
  Plus, Filter, List, Grid, Clock, Trash2, Edit2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Priority, TaskStatus } from '../types';

export default function Tasks() {
  const { state, dispatch, addTask } = useApp();
  const { tasks, tags } = state;

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<{ status: string; priority: string; tag: string }>({
    status: 'all',
    priority: 'all',
    tag: 'all',
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    status: 'todo' as TaskStatus,
    tags: [] as string[],
    dueDate: '',
    color: '#6366f1',
  });

  const filteredTasks = tasks.filter(task => {
    if (filter.status !== 'all' && task.status !== filter.status) return false;
    if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
    if (filter.tag !== 'all' && !task.tags.includes(filter.tag)) return false;
    return true;
  });

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

  const toggleTaskStatus = (task: typeof tasks[0]) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        ...task,
        status: task.status === 'done' ? 'todo' : 'done',
        completedAt: task.status === 'done' ? null : new Date().toISOString(),
      },
    });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const priorityColors = {
    urgent: 'var(--color-urgent)',
    high: 'var(--color-high)',
    medium: 'var(--color-medium)',
    low: 'var(--color-low)',
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  return (
    <>
      <Header title="Tasks" onAddClick={() => setShowModal(true)} />
      <div className="content">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} color="var(--text-muted)" />
                <select
                  className="input"
                  style={{ width: 'auto', padding: '8px 12px' }}
                  value={filter.status}
                  onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <select
                className="input"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={filter.priority}
                onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                className="input"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={filter.tag}
                onChange={(e) => setFilter(f => ({ ...f, tag: e.target.value }))}
              >
                <option value="all">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
              <button
                className={`btn btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        {viewMode === 'list' ? (
          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p className="text-muted">No tasks found. Create your first task!</p>
                <button
                  className="btn btn-primary mt-4"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={18} />
                  Add Task
                </button>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`task-item ${task.status === 'done' ? 'completed' : ''}`}
                >
                  <div
                    style={{
                      width: 4,
                      alignSelf: 'stretch',
                      borderRadius: 2,
                      background: task.color,
                    }}
                  />
                  <div
                    className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                    onClick={() => toggleTaskStatus(task)}
                  >
                    {task.status === 'done' && <CheckCircle size={14} />}
                  </div>

                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {format(parseISO(task.dueDate), 'MMM d')}
                        </span>
                      )}
                      {task.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        return tag ? (
                          <span
                            key={tag.id}
                            className="tag"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-3">
            {filteredTasks.map(task => (
              <div key={task.id} className="card">
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    background: task.color,
                    marginBottom: 16,
                  }}
                />
                <div className="flex items-center justify-between mb-2">
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority}
                  </span>
                  <div
                    className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                    onClick={() => toggleTaskStatus(task)}
                  >
                    {task.status === 'done' && <CheckCircle size={14} />}
                  </div>
                </div>
                <h4 style={{ marginBottom: 8 }}>{task.title}</h4>
                <p className="text-sm text-muted mb-4">{task.description || 'No description'}</p>
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar size={14} />
                    {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
                <label className="input-label">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Tags</label>
              <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    className="tag"
                    style={{
                      background: newTask.tags.includes(tag.id) ? tag.color : 'transparent',
                      borderColor: tag.color,
                      color: newTask.tags.includes(tag.id) ? 'white' : tag.color,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setNewTask(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag.id)
                          ? prev.tags.filter(t => t !== tag.id)
                          : [...prev.tags, tag.id],
                      }));
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
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
