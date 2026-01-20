import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Calendar, CheckSquare, FolderKanban, GanttChart,
  Target, Sparkles, BarChart3, MessageSquare, FileText, Clock,
  Hash, Settings, Moon, Sun, ChevronLeft, Zap
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'kanban', icon: FolderKanban, label: 'Kanban Board' },
  { id: 'gantt', icon: GanttChart, label: 'Gantt Chart' },
  { id: 'timeblock', icon: Clock, label: 'Time Blocking' },
];

const planningItems = [
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'habits', icon: Sparkles, label: 'Habit Builder' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'review', icon: Zap, label: 'Weekly Review' },
];

const collaborationItems = [
  { id: 'channels', icon: Hash, label: 'Channels' },
  { id: 'notes', icon: FileText, label: 'Notes' },
  { id: 'ai', icon: MessageSquare, label: 'AI Assistant' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { currentView, sidebarOpen, darkMode, tasks } = state;

  const pendingTasks = tasks.filter(t => t.status !== 'done').length;

  const NavSection = ({ title, items }: { title: string; items: typeof navItems }) => (
    <div className="nav-section">
      <div className="nav-section-title">{title}</div>
      {items.map(item => (
        <div
          key={item.id}
          className={`nav-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
        >
          <item.icon />
          <span>{item.label}</span>
          {item.id === 'tasks' && pendingTasks > 0 && (
            <span className="nav-item-badge">{pendingTasks}</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={24} color="white" />
          </div>
          {sidebarOpen && <h1>Flowstate</h1>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavSection title="Workspace" items={navItems} />
        <NavSection title="Planning" items={planningItems} />
        <NavSection title="Collaboration" items={collaborationItems} />
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
        <div
          className="nav-item"
          onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
        >
          {darkMode ? <Sun /> : <Moon />}
          {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </div>
        <div className="nav-item" onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
          <ChevronLeft style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)' }} />
          {sidebarOpen && <span>Collapse</span>}
        </div>
      </div>
    </aside>
  );
}
