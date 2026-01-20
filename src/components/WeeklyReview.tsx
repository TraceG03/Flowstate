import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import Modal from './Modal';
import { Plus, Star, CheckCircle, Target, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, subWeeks, addWeeks, isWithinInterval, parseISO
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function WeeklyReview() {
  const { state, dispatch } = useApp();
  const { tasks, goals, habits, weeklyReviews } = state;

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [review, setReview] = useState({
    rating: 3,
    insights: '',
    nextWeekFocus: '',
    notes: '',
  });

  const weekStart = startOfWeek(selectedWeek);
  const weekEnd = endOfWeek(selectedWeek);

  // Calculate week's statistics
  const tasksCompletedThisWeek = tasks.filter(t =>
    t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })
  );

  const tasksCreatedThisWeek = tasks.filter(t =>
    isWithinInterval(parseISO(t.createdAt), { start: weekStart, end: weekEnd })
  );

  const goalsProgressedThisWeek = goals.filter(g =>
    g.milestones.some(m =>
      m.completedAt && isWithinInterval(parseISO(m.completedAt), { start: weekStart, end: weekEnd })
    )
  );

  // Habit completion rate for the week
  const habitCompletionRate = habits.length > 0
    ? Math.round(
        (habits.reduce((sum, h) => {
          const weekDates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return format(date, 'yyyy-MM-dd');
          });
          const completed = weekDates.filter(d => h.completedDates.includes(d)).length;
          return sum + completed;
        }, 0) / (habits.length * 7)) * 100
      )
    : 0;

  const existingReview = weeklyReviews.find(r =>
    r.weekStart === format(weekStart, 'yyyy-MM-dd')
  );

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: 'ADD_WEEKLY_REVIEW',
      payload: {
        id: uuidv4(),
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        completedGoals: goalsProgressedThisWeek.map(g => g.id),
        insights: review.insights.split('\n').filter(Boolean),
        nextWeekFocus: review.nextWeekFocus.split('\n').filter(Boolean),
        rating: review.rating,
        notes: review.notes,
      },
    });

    setShowModal(false);
    setReview({ rating: 3, insights: '', nextWeekFocus: '', notes: '' });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setReview(prev => ({ ...prev, rating: star }))}
            style={{
              background: 'none',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              padding: 0,
            }}
          >
            <Star
              size={24}
              fill={star <= rating ? '#f59e0b' : 'transparent'}
              color={star <= rating ? '#f59e0b' : 'var(--text-muted)'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header title="Weekly Review" />
      <div className="content">
        {/* Week Navigation */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h2>Week of {format(weekStart, 'MMMM d')}</h2>
              <p className="text-muted">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </p>
            </div>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Week Stats */}
        <div className="grid grid-4 mb-6">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <CheckCircle size={24} color="#10b981" />
            </div>
            <div className="stat-content">
              <h3>{tasksCompletedThisWeek.length}</h3>
              <p>Tasks Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <Calendar size={24} color="#3b82f6" />
            </div>
            <div className="stat-content">
              <h3>{tasksCreatedThisWeek.length}</h3>
              <p>Tasks Created</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <Target size={24} color="#8b5cf6" />
            </div>
            <div className="stat-content">
              <h3>{goalsProgressedThisWeek.length}</h3>
              <p>Goals Advanced</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <TrendingUp size={24} color="#f59e0b" />
            </div>
            <div className="stat-content">
              <h3>{habitCompletionRate}%</h3>
              <p>Habit Rate</p>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          {/* Completed Tasks */}
          <div className="card">
            <h3 className="card-title mb-4">Completed This Week</h3>
            {tasksCompletedThisWeek.length === 0 ? (
              <p className="text-muted">No tasks completed this week</p>
            ) : (
              <div className="task-list">
                {tasksCompletedThisWeek.slice(0, 8).map(task => (
                  <div key={task.id} className="task-item completed">
                    <div
                      style={{
                        width: 4,
                        alignSelf: 'stretch',
                        borderRadius: 2,
                        background: task.color,
                      }}
                    />
                    <CheckCircle size={18} color="var(--color-success)" />
                    <div className="task-content">
                      <div className="task-title" style={{ textDecoration: 'line-through' }}>
                        {task.title}
                      </div>
                      {task.completedAt && (
                        <div className="task-meta">
                          Completed {format(parseISO(task.completedAt), 'EEE, MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Review Form/Display */}
          <div className="card">
            {existingReview ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title">Your Review</h3>
                  {renderStars(existingReview.rating)}
                </div>

                {existingReview.insights.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Key Insights</h4>
                    <ul className="text-muted">
                      {existingReview.insights.map((insight, i) => (
                        <li key={i} className="mb-1">• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {existingReview.nextWeekFocus.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Next Week Focus</h4>
                    <ul className="text-muted">
                      {existingReview.nextWeekFocus.map((focus, i) => (
                        <li key={i} className="mb-1">• {focus}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {existingReview.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-muted">{existingReview.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="card-title mb-4">Create Weekly Review</h3>
                <p className="text-muted mb-4">
                  Reflect on your week to improve productivity and set intentions for the coming week.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={18} />
                  Start Review
                </button>
              </>
            )}
          </div>
        </div>

        {/* Past Reviews */}
        {weeklyReviews.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-4">Past Reviews</h3>
            <div className="grid grid-3">
              {weeklyReviews
                .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
                .slice(0, 6)
                .map(r => (
                  <div key={r.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted">
                        Week of {format(parseISO(r.weekStart), 'MMM d')}
                      </span>
                      {renderStars(r.rating)}
                    </div>
                    <p className="text-sm truncate">
                      {r.insights[0] || 'No insights recorded'}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Weekly Review" onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleSubmitReview}>
            <div className="input-group">
              <label className="input-label">How would you rate this week?</label>
              {renderStars(review.rating, true)}
            </div>

            <div className="input-group">
              <label className="input-label">Key Insights (one per line)</label>
              <textarea
                className="input"
                placeholder="What did you learn this week?&#10;What went well?&#10;What could be improved?"
                value={review.insights}
                onChange={(e) => setReview(prev => ({ ...prev, insights: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Next Week Focus (one per line)</label>
              <textarea
                className="input"
                placeholder="What will you prioritize?&#10;Any goals to work toward?"
                value={review.nextWeekFocus}
                onChange={(e) => setReview(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Additional Notes</label>
              <textarea
                className="input"
                placeholder="Any other thoughts or reflections..."
                value={review.notes}
                onChange={(e) => setReview(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '20px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <CheckCircle size={18} />
                Complete Review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
