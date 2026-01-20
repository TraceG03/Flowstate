import { useApp } from '../context/AppContext';
import Header from './Header';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
  CheckCircle, TrendingUp, AlertTriangle, Flame
} from 'lucide-react';
import { format, parseISO, subDays, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

export default function Analytics() {
  const { state } = useApp();
  const { tasks, habits, goals } = state;

  const today = new Date();

  // Calculate statistics
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const missedDeadlines = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    return parseISO(t.dueDate) < today;
  }).length;

  // Tasks by priority
  const tasksByPriority = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#eab308' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#22c55e' },
  ];

  // Tasks by status
  const tasksByStatus = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#6b7280' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#f59e0b' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
  ];

  // Daily completions for last 14 days
  const dailyCompletions = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(today, 13 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const completed = tasks.filter(t =>
      t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dateStr
    ).length;
    return {
      date: format(date, 'MMM d'),
      completed,
    };
  });

  // Weekly productivity trend
  const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subDays(today, (7 - i) * 7));
    const weekEnd = endOfWeek(weekStart);
    const completed = tasks.filter(t =>
      t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })
    ).length;
    return {
      week: format(weekStart, 'MMM d'),
      completed,
    };
  });

  // Habit streaks
  const habitStreaks = habits.map(h => ({
    name: h.name,
    streak: h.streak,
    color: h.color,
  })).sort((a, b) => b.streak - a.streak).slice(0, 5);

  // Goal progress
  const goalProgress = goals.map(g => ({
    name: g.title,
    progress: g.progress,
  }));

  const stats = [
    {
      icon: CheckCircle,
      value: completedTasks,
      label: 'Completed Tasks',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      icon: TrendingUp,
      value: `${completionRate}%`,
      label: 'Completion Rate',
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
    },
    {
      icon: AlertTriangle,
      value: missedDeadlines,
      label: 'Missed Deadlines',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
    },
    {
      icon: Flame,
      value: habits.reduce((sum, h) => sum + h.streak, 0),
      label: 'Total Streaks',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <>
      <Header title="Analytics & Reports" />
      <div className="content">
        {/* Stats Grid */}
        <div className="grid grid-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: stat.bg }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-2 mb-6">
          {/* Daily Completions */}
          <div className="analytics-chart">
            <h3>Daily Completions (Last 14 Days)</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyCompletions}>
                  <defs>
                    <linearGradient id="colorDailyCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
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
                    fill="url(#colorDailyCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="analytics-chart">
            <h3>Weekly Productivity Trend</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-3 mb-6">
          {/* Tasks by Priority */}
          <div className="analytics-chart">
            <h3>Tasks by Priority</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks by Status */}
          <div className="analytics-chart">
            <h3>Tasks by Status</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Habit Streaks */}
          <div className="analytics-chart">
            <h3>Top Habit Streaks</h3>
            <div style={{ height: 250 }}>
              {habitStreaks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted">
                  No habits tracked yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitStreaks} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="streak" radius={[0, 4, 4, 0]}>
                      {habitStreaks.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        {goalProgress.length > 0 && (
          <div className="analytics-chart">
            <h3>Goal Progress</h3>
            <div className="mt-4">
              {goals.map(goal => (
                <div key={goal.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{goal.title}</span>
                    <span className="text-sm text-muted">{goal.progress}%</span>
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
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
