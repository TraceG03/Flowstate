import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Tasks from './components/Tasks';
import Kanban from './components/Kanban';
import GanttChart from './components/GanttChart';
import TimeBlocking from './components/TimeBlocking';
import Goals from './components/Goals';
import HabitBuilder from './components/HabitBuilder';
import Analytics from './components/Analytics';
import WeeklyReview from './components/WeeklyReview';
import Channels from './components/Channels';
import Notes from './components/Notes';
import AIAssistant from './components/AIAssistant';
import Auth from './components/Auth';
import './index.css';

function LoadingScreen() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
    </div>
  );
}

function AppContent() {
  const { state } = useApp();
  const { currentView } = state;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <Calendar />;
      case 'tasks':
        return <Tasks />;
      case 'kanban':
        return <Kanban />;
      case 'gantt':
        return <GanttChart />;
      case 'timeblock':
        return <TimeBlocking />;
      case 'goals':
        return <Goals />;
      case 'habits':
        return <HabitBuilder />;
      case 'analytics':
        return <Analytics />;
      case 'review':
        return <WeeklyReview />;
      case 'channels':
        return <Channels />;
      case 'notes':
        return <Notes />;
      case 'ai':
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // If Supabase is not configured, allow demo mode
  // If configured but not logged in, show auth
  if (isConfigured && !user) {
    return <Auth />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
