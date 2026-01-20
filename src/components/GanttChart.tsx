import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, addDays, startOfWeek, differenceInDays, parseISO, isToday,
  addWeeks, subWeeks
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function GanttChart() {
  const { state, dispatch, addProject } = useApp();
  const { projects, tasks } = state;

  const [showModal, setShowModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  });

  const today = new Date();
  const startDate = startOfWeek(addWeeks(today, weekOffset));
  const days = Array.from({ length: 28 }, (_, i) => addDays(startDate, i));

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

    const offsetDays = differenceInDays(startDay, startDate);
    const duration = differenceInDays(endDay, startDay) + 1;

    const left = Math.max(0, offsetDays) * 50;
    const width = Math.min(duration, 28 - Math.max(0, offsetDays)) * 50 - 8;

    if (offsetDays + duration < 0 || offsetDays > 28) {
      return { display: 'none' };
    }

    return {
      left: `${left + 4}px`,
      width: `${Math.max(width, 40)}px`,
    };
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  // Get tasks that have both start and end dates
  const tasksWithDates = tasks.filter(t => t.startDate && t.endDate);

  return (
    <>
      <Header title="Gantt Chart" onAddClick={() => setShowModal(true)} />
      <div className="content">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h3>
              {format(startDate, 'MMM d')} - {format(addDays(startDate, 27), 'MMM d, yyyy')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setWeekOffset(w => w - 2)}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setWeekOffset(0)}
              >
                Today
              </button>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setWeekOffset(w => w + 2)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="gantt-container">
          {/* Header */}
          <div className="gantt-header">
            <div className="gantt-task-names">Project / Task</div>
            <div className="gantt-dates">
              {days.map(day => (
                <div
                  key={day.toISOString()}
                  className={`gantt-date ${isToday(day) ? 'today' : ''}`}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div style={{ fontWeight: 600 }}>{format(day, 'd')}</div>
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
                <div className="gantt-task-bar-container">
                  {days.map(day => (
                    <div
                      key={day.toISOString()}
                      className={`gantt-cell ${isToday(day) ? 'today' : ''}`}
                    />
                  ))}
                  {barStyle.display !== 'none' && (
                    <div
                      className="gantt-bar"
                      style={{
                        ...barStyle,
                        background: project.color,
                      }}
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
                <div className="gantt-task-bar-container">
                  {days.map(day => (
                    <div
                      key={day.toISOString()}
                      className={`gantt-cell ${isToday(day) ? 'today' : ''}`}
                    />
                  ))}
                  {barStyle.display !== 'none' && (
                    <div
                      className="gantt-bar"
                      style={{
                        ...barStyle,
                        background: task.color,
                        opacity: 0.8,
                      }}
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
    </>
  );
}
