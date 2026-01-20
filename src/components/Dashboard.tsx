import React from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import {
  CheckCircle, Clock, Target, Flame, Calendar, ArrowRight,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { tasks, habits, goals, events } = state;

  const today = new Date();
  const completedToday = tasks.filter(t => 
    t.completedAt && isToday(parseISO(t.completedAt))
  ).length;

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent');
  const overdueTasks = pendingTasks.filter(t => 
    t.dueDate && parseISO(t.dueDate) < today
  );

  const todayEvents = events.filter(e => 
    isToday(parseISO(e.startDate))
  );

  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weeklyCompletions = tasks.filter(t =>
    t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })
  ).length;

  const activeHabits = habits.filter(h => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return h.completedDates.includes(todayStr);
  }).length;

  const totalStreaks = habits.reduce((sum, h) => sum + h.streak, 0);

  // Generate chart data for last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const completed = tasks.filter(t =>
      t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dateStr
    ).length;
    return {
      date: format(date, 'EEE'),
      completed,
    };
  });

  const stats = [
    {
      icon: CheckCircle,
      value: completedToday,
      label: 'Completed Today',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      icon: Clock,
      value: pendingTasks.length,
      label: 'Pending Tasks',
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.15)',
    },
    {
      icon: Target,
      value: goals.filter(g => !g.achieved).length,
      label: 'Active Goals',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.15)',
    },
    {
      icon: Flame,
      value: totalStreaks,
      label: 'Total Streaks',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <div className="content">
        {/* Stats Grid */}
        <div className="grid grid-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div
                className="stat-icon"
                style={{ background: stat.bg }}
              >
                <stat.icon size={24} color={stat.color} />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-3">
          {/* Today's Schedule */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today's Schedule</h3>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'calendar' })}
              >
                <ArrowRight size={16} />
              </button>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-muted">No events scheduled for today</p>
            ) : (
              <div className="task-list">
                {todayEvents.slice(0, 4).map(event => (
                  <div key={event.id} className="task-item">
                    <div
                      style={{
                        width: 4,
                        height: 40,
                        borderRadius: 2,
                        background: event.color,
                      }}
                    />
                    <div className="task-content">
                      <div className="task-title">{event.title}</div>
                      <div className="task-meta">
                        <Calendar size={14} />
                        {format(parseISO(event.startDate), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Urgent Tasks</h3>
              <span className="priority-badge priority-urgent">
                {urgentTasks.length}
              </span>
            </div>
            {urgentTasks.length === 0 ? (
              <p className="text-muted">No urgent tasks. Great job!</p>
            ) : (
              <div className="task-list">
                {urgentTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="task-item">
                    <div
                      className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={() => dispatch({
                        type: 'UPDATE_TASK',
                        payload: {
                          ...task,
                          status: task.status === 'done' ? 'todo' : 'done',
                          completedAt: task.status === 'done' ? null : new Date().toISOString(),
                        }
                      })}
                    >
                      {task.status === 'done' && <CheckCircle size={14} />}
                    </div>
                    <div className="task-content">
                      <div className="task-title">{task.title}</div>
                      {task.dueDate && (
                        <div className="task-meta">
                          <Clock size={14} />
                          {format(parseISO(task.dueDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Overdue</h3>
              {overdueTasks.length > 0 && (
                <AlertCircle size={20} color="var(--color-error)" />
              )}
            </div>
            {overdueTasks.length === 0 ? (
              <p className="text-muted">You're all caught up!</p>
            ) : (
              <div className="task-list">
                {overdueTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="task-item">
                    <div
                      className="task-checkbox"
                      onClick={() => dispatch({
                        type: 'UPDATE_TASK',
                        payload: {
                          ...task,
                          status: 'done',
                          completedAt: new Date().toISOString(),
                        }
                      })}
                    />
                    <div className="task-content">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta" style={{ color: 'var(--color-error)' }}>
                        <Clock size={14} />
                        Due {task.dueDate && format(parseISO(task.dueDate), 'MMM d')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Weekly Progress</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} color="var(--color-success)" />
                <span className="text-sm">{weeklyCompletions} tasks this week</span>
              </div>
            </div>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-4 mt-6">
          <button
            className="card"
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'tasks' })}
          >
            <CheckCircle size={24} color="var(--accent-primary)" />
            <h4 className="mt-2">Add Task</h4>
            <p className="text-sm text-muted mt-1">Create a new task</p>
          </button>
          <button
            className="card"
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'calendar' })}
          >
            <Calendar size={24} color="var(--color-success)" />
            <h4 className="mt-2">Schedule Event</h4>
            <p className="text-sm text-muted mt-1">Add to calendar</p>
          </button>
          <button
            className="card"
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'habits' })}
          >
            <Flame size={24} color="var(--color-warning)" />
            <h4 className="mt-2">Track Habit</h4>
            <p className="text-sm text-muted mt-1">Build consistency</p>
          </button>
          <button
            className="card"
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ai' })}
          >
            <Target size={24} color="var(--accent-secondary)" />
            <h4 className="mt-2">AI Assistant</h4>
            <p className="text-sm text-muted mt-1">Get help planning</p>
          </button>
        </div>
      </div>
    </>
  );
}
