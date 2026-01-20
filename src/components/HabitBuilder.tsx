import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, Flame, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function HabitBuilder() {
  const { state, dispatch, addHabit } = useApp();
  const { habits } = state;

  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    targetCount: 1,
    color: '#6366f1',
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;

    addHabit({
      name: newHabit.name,
      description: newHabit.description,
      frequency: newHabit.frequency,
      targetCount: newHabit.targetCount,
      color: newHabit.color,
    });

    setNewHabit({
      name: '',
      description: '',
      frequency: 'daily',
      targetCount: 1,
      color: '#6366f1',
    });
    setShowModal(false);
  };

  const toggleHabitDay = (habitId: string, date: string) => {
    dispatch({
      type: 'TOGGLE_HABIT',
      payload: { habitId, date },
    });
  };

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
  ];

  const suggestedHabits = [
    { name: 'Morning Meditation', description: '10 minutes of mindfulness', color: '#8b5cf6' },
    { name: 'Exercise', description: '30 minutes of physical activity', color: '#ef4444' },
    { name: 'Read', description: 'Read for 20 minutes', color: '#3b82f6' },
    { name: 'Drink Water', description: '8 glasses of water', color: '#14b8a6' },
    { name: 'Journal', description: 'Write about your day', color: '#f59e0b' },
    { name: 'Learn Something New', description: 'Spend 15 minutes learning', color: '#ec4899' },
  ];

  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const completedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;

  return (
    <>
      <Header title="Habit Builder" onAddClick={() => setShowModal(true)} />
      <div className="content">
        {/* Stats */}
        <div className="grid grid-4 mb-6">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <Flame size={24} color="#8b5cf6" />
            </div>
            <div className="stat-content">
              <h3>{totalStreak}</h3>
              <p>Total Streaks</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <CheckCircle size={24} color="#10b981" />
            </div>
            <div className="stat-content">
              <h3>{completedToday}/{habits.length}</h3>
              <p>Done Today</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <TrendingUp size={24} color="#3b82f6" />
            </div>
            <div className="stat-content">
              <h3>{habits.length}</h3>
              <p>Active Habits</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <Calendar size={24} color="#f59e0b" />
            </div>
            <div className="stat-content">
              <h3>{Math.max(...habits.map(h => h.streak), 0)}</h3>
              <p>Best Streak</p>
            </div>
          </div>
        </div>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <Flame size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
            <h3 className="mb-2">Start Building Habits</h3>
            <p className="text-muted mb-4">
              Track your daily habits and build powerful routines
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {habits.map(habit => {
              const isCompletedToday = habit.completedDates.includes(todayStr);

              return (
                <div key={habit.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: habit.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Flame size={24} color="white" />
                      </div>
                      <div>
                        <h3>{habit.name}</h3>
                        <p className="text-sm text-muted">{habit.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold" style={{ color: habit.color }}>
                          {habit.streak}
                        </div>
                        <div className="text-sm text-muted">day streak</div>
                      </div>
                      <button
                        className={`btn ${isCompletedToday ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => toggleHabitDay(habit.id, todayStr)}
                        style={{
                          background: isCompletedToday ? habit.color : undefined,
                          borderColor: isCompletedToday ? habit.color : undefined,
                        }}
                      >
                        <CheckCircle size={18} />
                        {isCompletedToday ? 'Completed' : 'Mark Done'}
                      </button>
                    </div>
                  </div>

                  {/* Habit Calendar Grid */}
                  <div className="habit-grid" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
                    {last30Days.map(date => {
                      const isCompleted = habit.completedDates.includes(date);
                      const isToday = date === todayStr;

                      return (
                        <div
                          key={date}
                          className={`habit-day ${isCompleted ? 'completed' : ''}`}
                          onClick={() => toggleHabitDay(habit.id, date)}
                          style={{
                            background: isCompleted ? habit.color : undefined,
                            borderColor: isToday ? habit.color : undefined,
                            borderWidth: isToday ? 2 : 1,
                          }}
                          title={format(new Date(date), 'MMM d, yyyy')}
                        >
                          {format(new Date(date), 'd')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Suggested Habits */}
        <div className="card mt-6">
          <h3 className="card-title mb-4">Suggested Habits</h3>
          <div className="grid grid-3">
            {suggestedHabits.map((habit, i) => (
              <button
                key={i}
                className="card"
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => {
                  setNewHabit({
                    name: habit.name,
                    description: habit.description,
                    frequency: 'daily',
                    targetCount: 1,
                    color: habit.color,
                  });
                  setShowModal(true);
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: habit.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Plus size={20} color="white" />
                </div>
                <h4>{habit.name}</h4>
                <p className="text-sm text-muted">{habit.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Create Habit" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Habit Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Morning Meditation"
                value={newHabit.name}
                onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="Describe your habit..."
                value={newHabit.description}
                onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Frequency</label>
                <select
                  className="input"
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value as any }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Target Count</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={newHabit.targetCount}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, targetCount: parseInt(e.target.value) }))}
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
                    onClick={() => setNewHabit(prev => ({ ...prev, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: newHabit.color === color ? '3px solid white' : 'none',
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
                Create Habit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
