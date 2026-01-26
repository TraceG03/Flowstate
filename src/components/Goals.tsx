import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, Target, CheckCircle, Circle, Trophy, Trash2, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Goal } from '../types';

export default function Goals() {
  const { state, addGoal, updateGoal, deleteGoal } = useApp();
  const { goals } = state;

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    milestones: [] as { id: string; title: string; completed: boolean }[],
  });
  const [newMilestone, setNewMilestone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;

    addGoal({
      title: newGoal.title,
      description: newGoal.description,
      targetDate: newGoal.targetDate || null,
      milestones: newGoal.milestones.map(m => ({
        ...m,
        completedAt: null,
      })),
    });

    resetForm();
  };

  const addMilestoneToForm = () => {
    if (!newMilestone.trim()) return;
    setNewGoal(prev => ({
      ...prev,
      milestones: [...prev.milestones, { id: uuidv4(), title: newMilestone, completed: false }],
    }));
    setNewMilestone('');
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null }
        : m
    );

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    updateGoal({
      ...goal,
      milestones: updatedMilestones,
      progress,
      achieved: progress === 100,
    });
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate || '',
      milestones: goal.milestones.map(m => ({ id: m.id, title: m.title, completed: m.completed })),
    });
    setShowModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !newGoal.title) return;

    const completedCount = newGoal.milestones.filter(m => m.completed).length;
    const progress = newGoal.milestones.length > 0 
      ? Math.round((completedCount / newGoal.milestones.length) * 100) 
      : editingGoal.progress;

    updateGoal({
      ...editingGoal,
      title: newGoal.title,
      description: newGoal.description,
      targetDate: newGoal.targetDate || null,
      milestones: newGoal.milestones.map(m => ({
        ...m,
        completedAt: m.completed ? new Date().toISOString() : null,
      })),
      progress,
      achieved: progress === 100,
    });

    resetForm();
  };

  const resetForm = () => {
    setNewGoal({
      title: '',
      description: '',
      targetDate: '',
      milestones: [],
    });
    setEditingGoal(null);
    setShowModal(false);
  };

  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);

  return (
    <>
      <Header title="Goals" onAddClick={() => setShowModal(true)} />
      <div className="content">
        {/* Active Goals */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target size={20} color="var(--accent-primary)" />
            Active Goals ({activeGoals.length})
          </h3>

          {activeGoals.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Target size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
              <h3 className="mb-2">Set Your First Goal</h3>
              <p className="text-muted mb-4">
                Define goals with milestones to track your progress
              </p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={18} />
                Create Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-2">
              {activeGoals.map(goal => (
                <div key={goal.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => startEditGoal(goal)}
                        title="Edit goal"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                        title="Delete goal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted mb-4">{goal.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Progress</span>
                      <span className="text-sm font-semibold">{goal.progress}%</span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${goal.progress}%`,
                          height: '100%',
                          background: 'var(--gradient-primary)',
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Target Date */}
                  {goal.targetDate && (
                    <div className="text-sm text-muted mb-4">
                      Target: {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                    </div>
                  )}

                  {/* Milestones */}
                  <div className="flex flex-col gap-2">
                    {goal.milestones.map(milestone => (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"
                        onClick={() => toggleMilestone(goal.id, milestone.id)}
                      >
                        {milestone.completed ? (
                          <CheckCircle size={18} color="var(--color-success)" />
                        ) : (
                          <Circle size={18} color="var(--text-muted)" />
                        )}
                        <span className={milestone.completed ? 'text-muted line-through' : ''}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achieved Goals */}
        {achievedGoals.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy size={20} color="var(--color-warning)" />
              Achieved Goals ({achievedGoals.length})
            </h3>
            <div className="grid grid-2">
              {achievedGoals.map(goal => (
                <div key={goal.id} className="card" style={{ opacity: 0.7 }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Trophy size={18} color="var(--color-warning)" />
                      {goal.title}
                    </h4>
                    <span className="priority-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)' }}>
                      Achieved
                    </span>
                  </div>
                  <p className="text-sm text-muted">{goal.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editingGoal ? "Edit Goal" : "Create Goal"} onClose={resetForm}>
          <form onSubmit={editingGoal ? handleEditSubmit : handleSubmit}>
            <div className="input-group">
              <label className="input-label">Goal Title</label>
              <input
                type="text"
                className="input"
                placeholder="What do you want to achieve?"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="Describe your goal..."
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Target Date</label>
              <input
                type="date"
                className="input"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Milestones</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="input"
                  placeholder="Add a milestone..."
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestoneToForm())}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addMilestoneToForm}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {newGoal.milestones.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded-lg"
                  >
                    <Circle size={16} color="var(--text-muted)" />
                    <span className="flex-1">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => setNewGoal(prev => ({
                        ...prev,
                        milestones: prev.milestones.filter(ms => ms.id !== m.id),
                      }))}
                      className="text-muted hover:text-[var(--color-error)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingGoal ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
