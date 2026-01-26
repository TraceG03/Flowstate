import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Trash2, Edit2 } from 'lucide-react';
import {
  format, addDays, startOfWeek, startOfMonth, startOfYear, differenceInDays, parseISO, isToday,
  addWeeks, addMonths, addYears, getDaysInMonth, eachMonthOfInterval, isSameMonth
} from 'date-fns';
import type { Project, Task } from '../types';

type ViewMode = 'week' | 'month' | 'year';

export default function GanttChart() {
  const { state, addProject, updateProject, deleteProject, updateTask, deleteTask } = useApp();
  const { projects, tasks } = state;

  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [offset, setOffset] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{ name?: string; description?: string; startDate?: string; endDate?: string; color?: string; title?: string }>({});

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  });

  const today = new Date();
  
  // Calculate start date and time units based on view mode
  const getViewConfig = () => {
    switch (viewMode) {
      case 'week':
        return {
          startDate: startOfWeek(addWeeks(today, offset * 2)),
          units: 28,
          cellWidth: 50,
          getUnit: (i: number, start: Date) => addDays(start, i),
          formatHeader: (date: Date) => (
            <>
              <div>{format(date, 'EEE')}</div>
              <div style={{ fontWeight: 600 }}>{format(date, 'd')}</div>
            </>
          ),
          isCurrentUnit: (date: Date) => isToday(date),
          navStep: 2,
        };
      case 'month':
        const monthStart = startOfMonth(addMonths(today, offset));
        const daysInMonth = getDaysInMonth(monthStart);
        return {
          startDate: monthStart,
          units: daysInMonth,
          cellWidth: 35,
          getUnit: (i: number, start: Date) => addDays(start, i),
          formatHeader: (date: Date) => (
            <>
              <div style={{ fontSize: 10 }}>{format(date, 'EEE').charAt(0)}</div>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{format(date, 'd')}</div>
            </>
          ),
          isCurrentUnit: (date: Date) => isToday(date),
          navStep: 1,
        };
      case 'year':
        const yearStart = startOfYear(addYears(today, offset));
        const yearEnd = addYears(yearStart, 1);
        const months = eachMonthOfInterval({ start: yearStart, end: addDays(yearEnd, -1) });
        return {
          startDate: yearStart,
          units: 12,
          cellWidth: 80,
          getUnit: (i: number, start: Date) => addMonths(start, i),
          formatHeader: (date: Date) => (
            <>
              <div style={{ fontWeight: 600 }}>{format(date, 'MMM')}</div>
            </>
          ),
          isCurrentUnit: (date: Date) => isSameMonth(date, today),
          navStep: 1,
          months,
        };
      default:
        return {
          startDate: startOfWeek(addWeeks(today, offset * 2)),
          units: 28,
          cellWidth: 50,
          getUnit: (i: number, start: Date) => addDays(start, i),
          formatHeader: (date: Date) => (
            <>
              <div>{format(date, 'EEE')}</div>
              <div style={{ fontWeight: 600 }}>{format(date, 'd')}</div>
            </>
          ),
          isCurrentUnit: (date: Date) => isToday(date),
          navStep: 2,
        };
    }
  };

  const viewConfig = getViewConfig();
  const startDate = viewConfig.startDate;
  const timeUnits = Array.from({ length: viewConfig.units }, (_, i) => viewConfig.getUnit(i, startDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    addProject({
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      tasks: [],
      startDate: newProject.startDate,
      endDate: newProject.endDate,
    });

    setNewProject({
      name: '',
      description: '',
      color: '#6366f1',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    });
    setShowModal(false);
  };

  const getBarStyle = (start: string, end: string) => {
    const startDay = parseISO(start);
    const endDay = parseISO(end);
    const cellWidth = viewConfig.cellWidth;
    const totalUnits = viewConfig.units;

    if (viewMode === 'year') {
      // For yearly view, calculate position based on months
      const startOffset = (startDay.getFullYear() - startDate.getFullYear()) * 12 + 
                          (startDay.getMonth() - startDate.getMonth()) + 
                          (startDay.getDate() - 1) / getDaysInMonth(startDay);
      const endOffset = (endDay.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDay.getMonth() - startDate.getMonth()) + 
                        endDay.getDate() / getDaysInMonth(endDay);
      const duration = endOffset - startOffset;

      if (startOffset + duration < 0 || startOffset > totalUnits) {
        return { display: 'none' };
      }

      const left = Math.max(0, startOffset) * cellWidth;
      const width = Math.min(duration, totalUnits - Math.max(0, startOffset)) * cellWidth - 4;

      return {
        left: `${left + 2}px`,
        width: `${Math.max(width, 30)}px`,
      };
    } else {
      // For week/month view, calculate position based on days
      const offsetDays = differenceInDays(startDay, startDate);
      const duration = differenceInDays(endDay, startDay) + 1;

      if (offsetDays + duration < 0 || offsetDays > totalUnits) {
        return { display: 'none' };
      }

      const left = Math.max(0, offsetDays) * cellWidth;
      const width = Math.min(duration, totalUnits - Math.max(0, offsetDays)) * cellWidth - 8;

      return {
        left: `${left + 4}px`,
        width: `${Math.max(width, 30)}px`,
      };
    }
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  // Get tasks that have both start and end dates
  const tasksWithDates = tasks.filter(t => t.startDate && t.endDate);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setIsEditing(false);
    setEditData({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      color: project.color,
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedProject(null);
    setIsEditing(false);
    setEditData({
      title: task.title,
      description: task.description,
      startDate: task.startDate || '',
      endDate: task.endDate || '',
      color: task.color,
    });
  };

  const handleSaveProject = () => {
    if (selectedProject && editData.name) {
      updateProject({
        ...selectedProject,
        name: editData.name,
        description: editData.description || '',
        startDate: editData.startDate || selectedProject.startDate,
        endDate: editData.endDate || selectedProject.endDate,
        color: editData.color || selectedProject.color,
      });
      setIsEditing(false);
      setSelectedProject(null);
    }
  };

  const handleSaveTask = () => {
    if (selectedTask && editData.title) {
      updateTask({
        ...selectedTask,
        title: editData.title,
        description: editData.description || '',
        startDate: editData.startDate || null,
        endDate: editData.endDate || null,
        color: editData.color || selectedTask.color,
      });
      setIsEditing(false);
      setSelectedTask(null);
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject && confirm('Are you sure you want to delete this project?')) {
      deleteProject(selectedProject.id);
      setSelectedProject(null);
    }
  };

  const handleDeleteTask = () => {
    if (selectedTask && confirm('Are you sure you want to delete this task?')) {
      deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  const closeDetailModal = () => {
    setSelectedProject(null);
    setSelectedTask(null);
    setIsEditing(false);
  };

  return (
    <>
      <Header title="Gantt Chart" onAddClick={() => setShowModal(true)} />
      <div className="content">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h3>
              {viewMode === 'week' && `${format(startDate, 'MMM d')} - ${format(addDays(startDate, 27), 'MMM d, yyyy')}`}
              {viewMode === 'month' && format(startDate, 'MMMM yyyy')}
              {viewMode === 'year' && format(startDate, 'yyyy')}
            </h3>
            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <div className="flex" style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 4 }}>
                <button
                  className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setViewMode('week'); setOffset(0); }}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  Week
                </button>
                <button
                  className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setViewMode('month'); setOffset(0); }}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  Month
                </button>
                <button
                  className={`btn btn-sm ${viewMode === 'year' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setViewMode('year'); setOffset(0); }}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  Year
                </button>
              </div>
              
              <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
              
              {/* Navigation */}
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setOffset(o => o - viewConfig.navStep)}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setOffset(0)}
              >
                Today
              </button>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setOffset(o => o + viewConfig.navStep)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="gantt-container" style={{ overflowX: 'auto' }}>
          {/* Header */}
          <div className="gantt-header">
            <div className="gantt-task-names">Project / Task</div>
            <div className="gantt-dates" style={{ width: viewConfig.units * viewConfig.cellWidth }}>
              {timeUnits.map(unit => (
                <div
                  key={unit.toISOString()}
                  className={`gantt-date ${viewConfig.isCurrentUnit(unit) ? 'today' : ''}`}
                  style={{ width: viewConfig.cellWidth, minWidth: viewConfig.cellWidth }}
                >
                  {viewConfig.formatHeader(unit)}
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          {projects.map(project => {
            const barStyle = getBarStyle(project.startDate, project.endDate);
            return (
              <div key={project.id} className="gantt-row">
                <div className="gantt-task-name">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: project.color,
                    }}
                  />
                  <span className="font-semibold">{project.name}</span>
                </div>
                <div className="gantt-task-bar-container" style={{ width: viewConfig.units * viewConfig.cellWidth }}>
                  {timeUnits.map(unit => (
                    <div
                      key={unit.toISOString()}
                      className={`gantt-cell ${viewConfig.isCurrentUnit(unit) ? 'today' : ''}`}
                      style={{ width: viewConfig.cellWidth, minWidth: viewConfig.cellWidth }}
                    />
                  ))}
                  {barStyle.display !== 'none' && (
                    <div
                      className="gantt-bar"
                      style={{
                        ...barStyle,
                        background: project.color,
                        cursor: 'pointer',
                        fontSize: viewMode === 'year' ? 11 : 13,
                      }}
                      onClick={() => handleProjectClick(project)}
                      title="Click to view details"
                    >
                      {project.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Tasks with dates */}
          {tasksWithDates.map(task => {
            const barStyle = getBarStyle(task.startDate!, task.endDate!);
            return (
              <div key={task.id} className="gantt-row">
                <div className="gantt-task-name">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: task.color,
                    }}
                  />
                  <span>{task.title}</span>
                </div>
                <div className="gantt-task-bar-container" style={{ width: viewConfig.units * viewConfig.cellWidth }}>
                  {timeUnits.map(unit => (
                    <div
                      key={unit.toISOString()}
                      className={`gantt-cell ${viewConfig.isCurrentUnit(unit) ? 'today' : ''}`}
                      style={{ width: viewConfig.cellWidth, minWidth: viewConfig.cellWidth }}
                    />
                  ))}
                  {barStyle.display !== 'none' && (
                    <div
                      className="gantt-bar"
                      style={{
                        ...barStyle,
                        background: task.color,
                        opacity: 0.8,
                        cursor: 'pointer',
                        fontSize: viewMode === 'year' ? 11 : 13,
                      }}
                      onClick={() => handleTaskClick(task)}
                      title="Click to view details"
                    >
                      {task.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {projects.length === 0 && tasksWithDates.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <p className="text-muted mb-4">No projects or scheduled tasks yet.</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={18} />
                Add Project
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title="Add Project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Project Name</label>
              <input
                type="text"
                className="input"
                placeholder="Enter project name"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="Project description..."
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewProject(prev => ({ ...prev, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: newProject.color === color ? '3px solid white' : 'none',
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
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal title={isEditing ? "Edit Project" : "Project Details"} onClose={closeDetailModal}>
          {isEditing ? (
            <div>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input
                  type="text"
                  className="input"
                  value={editData.name || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  value={editData.description || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-2">
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={editData.startDate || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={editData.endDate || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Color</label>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditData(prev => ({ ...prev, color }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: color,
                        border: editData.color === color ? '3px solid white' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveProject}>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: selectedProject.color,
                  }}
                />
                <h2 style={{ margin: 0, fontSize: 20 }}>{selectedProject.name}</h2>
              </div>

              {selectedProject.description && (
                <p className="text-muted" style={{ marginBottom: 16 }}>
                  {selectedProject.description}
                </p>
              )}

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Calendar size={16} />
                  <span className="text-muted">Timeline</span>
                </div>
                <p style={{ margin: 0 }}>
                  {format(parseISO(selectedProject.startDate), 'MMM d, yyyy')} - {format(parseISO(selectedProject.endDate), 'MMM d, yyyy')}
                </p>
                <p className="text-muted" style={{ marginTop: 4, fontSize: 14 }}>
                  {differenceInDays(parseISO(selectedProject.endDate), parseISO(selectedProject.startDate)) + 1} days
                </p>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Clock size={16} />
                  <span className="text-muted">Progress</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4 }}>
                    <div
                      style={{
                        width: `${selectedProject.progress}%`,
                        height: '100%',
                        background: selectedProject.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 600 }}>{selectedProject.progress}%</span>
                </div>
              </div>

              <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleDeleteProject}>
                  <Trash2 size={16} />
                  Delete
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} />
                  Edit
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal title={isEditing ? "Edit Task" : "Task Details"} onClose={closeDetailModal}>
          {isEditing ? (
            <div>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input
                  type="text"
                  className="input"
                  value={editData.title || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  value={editData.description || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-2">
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={editData.startDate || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={editData.endDate || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Color</label>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditData(prev => ({ ...prev, color }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: color,
                        border: editData.color === color ? '3px solid white' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveTask}>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: selectedTask.color,
                  }}
                />
                <h2 style={{ margin: 0, fontSize: 20 }}>{selectedTask.title}</h2>
              </div>

              {selectedTask.description && (
                <p className="text-muted" style={{ marginBottom: 16 }}>
                  {selectedTask.description}
                </p>
              )}

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Calendar size={16} />
                  <span className="text-muted">Schedule</span>
                </div>
                <p style={{ margin: 0 }}>
                  {selectedTask.startDate && selectedTask.endDate ? (
                    <>
                      {format(parseISO(selectedTask.startDate), 'MMM d, yyyy')} - {format(parseISO(selectedTask.endDate), 'MMM d, yyyy')}
                      <span className="text-muted" style={{ marginLeft: 8, fontSize: 14 }}>
                        ({differenceInDays(parseISO(selectedTask.endDate), parseISO(selectedTask.startDate)) + 1} days)
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">No dates set</span>
                  )}
                </p>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: 12 }}>Status</span>
                    <p style={{ margin: '4px 0 0', textTransform: 'capitalize' }}>{selectedTask.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: 12 }}>Priority</span>
                    <p style={{ margin: '4px 0 0', textTransform: 'capitalize' }}>{selectedTask.priority}</p>
                  </div>
                  {selectedTask.dueDate && (
                    <div>
                      <span className="text-muted" style={{ fontSize: 12 }}>Due Date</span>
                      <p style={{ margin: '4px 0 0' }}>{format(parseISO(selectedTask.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleDeleteTask}>
                  <Trash2 size={16} />
                  Delete
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} />
                  Edit
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
