import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Task, Event, Project, Habit, Goal, Channel, Template, Reminder,
  Tag, TimeBlock, Note, WeeklyReview, NoteItem
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AppState {
  tasks: Task[];
  events: Event[];
  projects: Project[];
  habits: Habit[];
  goals: Goal[];
  channels: Channel[];
  templates: Template[];
  reminders: Reminder[];
  tags: Tag[];
  weeklyReviews: WeeklyReview[];
  notes: NoteItem[];
  currentView: string;
  selectedDate: string;
  sidebarOpen: boolean;
  darkMode: boolean;
  loading: boolean;
}

type Action =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'TOGGLE_HABIT'; payload: { habitId: string; date: string } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_CHANNEL'; payload: Channel }
  | { type: 'ADD_MESSAGE'; payload: { channelId: string; message: any } }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'ADD_TAG'; payload: Tag }
  | { type: 'DELETE_TAG'; payload: string }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'DISMISS_REMINDER'; payload: string }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'ADD_TIME_BLOCK'; payload: { taskId: string; timeBlock: TimeBlock } }
  | { type: 'ADD_TASK_NOTE'; payload: { taskId: string; note: Note } }
  | { type: 'ADD_WEEKLY_REVIEW'; payload: WeeklyReview }
  | { type: 'SET_WEEKLY_REVIEWS'; payload: WeeklyReview[] }
  | { type: 'ADD_NOTE'; payload: NoteItem }
  | { type: 'UPDATE_NOTE'; payload: NoteItem }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_NOTES'; payload: NoteItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialTags: Tag[] = [
  { id: '1', name: 'Work', color: '#3B82F6' },
  { id: '2', name: 'Personal', color: '#10B981' },
  { id: '3', name: 'Health', color: '#EF4444' },
  { id: '4', name: 'Learning', color: '#8B5CF6' },
  { id: '5', name: 'Finance', color: '#F59E0B' },
];

const initialTemplates: Template[] = [
  {
    id: '1',
    name: 'Daily Standup',
    description: 'Quick template for daily standup tasks',
    category: 'Work',
    tasks: [
      { title: 'Review yesterday\'s progress', priority: 'medium' },
      { title: 'Plan today\'s tasks', priority: 'high' },
      { title: 'Check blockers', priority: 'urgent' },
    ]
  },
  {
    id: '2',
    name: 'Weekly Planning',
    description: 'Plan your week ahead',
    category: 'Productivity',
    tasks: [
      { title: 'Review last week\'s goals', priority: 'high' },
      { title: 'Set weekly priorities', priority: 'urgent' },
      { title: 'Schedule important meetings', priority: 'high' },
      { title: 'Block focus time', priority: 'medium' },
    ]
  },
  {
    id: '3',
    name: 'Project Kickoff',
    description: 'Start a new project right',
    category: 'Projects',
    tasks: [
      { title: 'Define project scope', priority: 'urgent' },
      { title: 'Identify stakeholders', priority: 'high' },
      { title: 'Create timeline', priority: 'high' },
      { title: 'Assign roles', priority: 'medium' },
      { title: 'Set up communication channels', priority: 'medium' },
    ]
  }
];

const initialState: AppState = {
  tasks: [],
  events: [],
  projects: [],
  habits: [],
  goals: [],
  channels: [
    { id: '1', name: 'General', description: 'General discussions', color: '#3B82F6', messages: [] },
    { id: '2', name: 'Projects', description: 'Project updates', color: '#10B981', messages: [] },
    { id: '3', name: 'Ideas', description: 'Share your ideas', color: '#8B5CF6', messages: [] },
  ],
  templates: initialTemplates,
  reminders: [],
  tags: initialTags,
  weeklyReviews: [],
  notes: [],
  currentView: 'dashboard',
  selectedDate: new Date().toISOString().split('T')[0],
  sidebarOpen: true,
  darkMode: true,
  loading: true,
};

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  if (sorted[0] !== today) return 0;
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e)
      };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h)
      };
    case 'TOGGLE_HABIT': {
      const { habitId, date } = action.payload;
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id !== habitId) return h;
          const isCompleted = h.completedDates.includes(date);
          const completedDates = isCompleted
            ? h.completedDates.filter(d => d !== date)
            : [...h.completedDates, date];
          return { ...h, completedDates, streak: calculateStreak(completedDates) };
        })
      };
    }
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g)
      };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload };
    case 'ADD_CHANNEL':
      return { ...state, channels: [...state.channels, action.payload] };
    case 'ADD_MESSAGE':
      return {
        ...state,
        channels: state.channels.map(c =>
          c.id === action.payload.channelId
            ? { ...c, messages: [...c.messages, action.payload.message] }
            : c
        )
      };
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.payload] };
    case 'DELETE_TAG':
      return { ...state, tags: state.tags.filter(t => t.id !== action.payload) };
    case 'ADD_REMINDER':
      return { ...state, reminders: [...state.reminders, action.payload] };
    case 'DISMISS_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map(r =>
          r.id === action.payload ? { ...r, dismissed: true } : r
        )
      };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'ADD_TIME_BLOCK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, timeBlocks: [...t.timeBlocks, action.payload.timeBlock] }
            : t
        )
      };
    case 'ADD_TASK_NOTE':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, notes: [...t.notes, action.payload.note] }
            : t
        )
      };
    case 'SET_WEEKLY_REVIEWS':
      return { ...state, weeklyReviews: action.payload };
    case 'ADD_WEEKLY_REVIEW':
      return { ...state, weeklyReviews: [...state.weeklyReviews, action.payload] };
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(n => n.id === action.payload.id ? action.payload : n)
      };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload, loading: false };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'notes' | 'timeBlocks'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Event operations
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  // Project operations
  addProject: (project: Omit<Project, 'id' | 'progress'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Habit operations
  addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'createdAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  // Goal operations
  addGoal: (goal: Omit<Goal, 'id' | 'achieved' | 'progress'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Note operations
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (note: NoteItem) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  // Reminder operations
  addReminder: (reminder: Omit<Reminder, 'id' | 'dismissed'>) => void;
  // Template operations
  applyTemplate: (templateId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Load data from Supabase (if configured and logged in) or localStorage
  useEffect(() => {
    async function loadData() {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isSupabaseConfigured && supabase && user) {
        // Load from Supabase when user is logged in
        try {
          const [
            { data: tasks },
            { data: events },
            { data: projects },
            { data: habits },
            { data: goals },
            { data: notes },
          ] = await Promise.all([
            supabase.from('tasks').select('*').eq('user_id', user.id),
            supabase.from('events').select('*').eq('user_id', user.id),
            supabase.from('projects').select('*').eq('user_id', user.id),
            supabase.from('habits').select('*').eq('user_id', user.id),
            supabase.from('goals').select('*').eq('user_id', user.id),
            supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          ]);

          dispatch({
            type: 'LOAD_STATE',
            payload: {
              tasks: (tasks || []).map(t => ({
                ...t,
                tags: t.tags || [],
                notes: [],
                timeBlocks: [],
                dueDate: t.due_date,
                startDate: t.start_date,
                endDate: t.end_date,
                projectId: t.project_id,
                completedAt: t.completed_at,
                createdAt: t.created_at,
              })),
              events: (events || []).map(e => ({
                ...e,
                startDate: e.start_date,
                endDate: e.end_date,
                allDay: e.all_day,
              })),
              projects: (projects || []).map(p => ({
                ...p,
                tasks: [],
                startDate: p.start_date,
                endDate: p.end_date,
              })),
              habits: (habits || []).map(h => ({
                ...h,
                completedDates: h.completed_dates || [],
                targetCount: h.target_count,
                createdAt: h.created_at,
              })),
              goals: (goals || []).map(g => ({
                ...g,
                milestones: [],
                targetDate: g.target_date,
              })),
              notes: (notes || []).map(n => ({
                ...n,
                createdAt: n.created_at,
                updatedAt: n.updated_at,
              })),
            },
          });
        } catch (error) {
          console.error('Error loading data from Supabase:', error);
          // Fallback to localStorage on error
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage (demo mode or not logged in)
        loadFromLocalStorage();
      }
    }

    function loadFromLocalStorage() {
      const saved = localStorage.getItem('productivityAppState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        } catch (e) {
          console.error('Failed to load saved state');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    loadData();
  }, [user]);

  // Always save to localStorage (acts as local cache/backup)
  useEffect(() => {
    if (!state.loading) {
      const { loading, ...stateToSave } = state;
      localStorage.setItem('productivityAppState', JSON.stringify(stateToSave));
    }
  }, [state]);

  // Apply dark/light mode to the document
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    }
  }, [state.darkMode]);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'notes' | 'timeBlocks'>) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      notes: [],
      timeBlocks: [],
    };

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('tasks').insert({
        id: newTask.id,
        user_id: user.id,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        tags: newTask.tags,
        due_date: newTask.dueDate,
        start_date: newTask.startDate,
        end_date: newTask.endDate,
        project_id: newTask.projectId,
        completed_at: newTask.completedAt,
        color: newTask.color,
      });
      if (error) console.error('Error adding task:', error);
    }

    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const addEvent = async (event: Omit<Event, 'id'>) => {
    const newEvent: Event = { ...event, id: uuidv4() };

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('events').insert({
        id: newEvent.id,
        user_id: user.id,
        title: newEvent.title,
        description: newEvent.description,
        start_date: newEvent.startDate,
        end_date: newEvent.endDate,
        all_day: newEvent.allDay,
        color: newEvent.color,
        recurring: newEvent.recurring,
        reminder: newEvent.reminder,
      });
      if (error) console.error('Error adding event:', error);
    }

    dispatch({ type: 'ADD_EVENT', payload: newEvent });
  };

  const addProject = async (project: Omit<Project, 'id' | 'progress'>) => {
    const newProject: Project = { ...project, id: uuidv4(), progress: 0 };

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('projects').insert({
        id: newProject.id,
        user_id: user.id,
        name: newProject.name,
        description: newProject.description,
        color: newProject.color,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        progress: 0,
      });
      if (error) console.error('Error adding project:', error);
    }

    dispatch({ type: 'ADD_PROJECT', payload: newProject });
  };

  const addHabit = async (habit: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      completedDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('habits').insert({
        id: newHabit.id,
        user_id: user.id,
        name: newHabit.name,
        description: newHabit.description,
        frequency: newHabit.frequency,
        target_count: newHabit.targetCount,
        color: newHabit.color,
        completed_dates: [],
        streak: 0,
      });
      if (error) console.error('Error adding habit:', error);
    }

    dispatch({ type: 'ADD_HABIT', payload: newHabit });
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'achieved' | 'progress'>) => {
    const newGoal: Goal = { ...goal, id: uuidv4(), achieved: false, progress: 0 };

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('goals').insert({
        id: newGoal.id,
        user_id: user.id,
        title: newGoal.title,
        description: newGoal.description,
        target_date: newGoal.targetDate,
        progress: 0,
        achieved: false,
      });
      if (error) console.error('Error adding goal:', error);
    }

    dispatch({ type: 'ADD_GOAL', payload: newGoal });
  };

  // ============ UPDATE FUNCTIONS ============

  const updateTask = async (task: Task) => {
    // Update local state first for immediate UI feedback
    dispatch({ type: 'UPDATE_TASK', payload: task });

    // Sync to Supabase if configured and user is logged in
    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('tasks').update({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        due_date: task.dueDate,
        start_date: task.startDate,
        end_date: task.endDate,
        project_id: task.projectId,
        completed_at: task.completedAt,
        color: task.color,
      }).eq('id', task.id).eq('user_id', user.id);
      if (error) console.error('Error updating task:', error);
    }
  };

  const updateEvent = async (event: Event) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('events').update({
        title: event.title,
        description: event.description,
        start_date: event.startDate,
        end_date: event.endDate,
        all_day: event.allDay,
        color: event.color,
        recurring: event.recurring,
        reminder: event.reminder,
      }).eq('id', event.id).eq('user_id', user.id);
      if (error) console.error('Error updating event:', error);
    }
  };

  const updateProject = async (project: Project) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: project });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('projects').update({
        name: project.name,
        description: project.description,
        color: project.color,
        start_date: project.startDate,
        end_date: project.endDate,
        progress: project.progress,
      }).eq('id', project.id).eq('user_id', user.id);
      if (error) console.error('Error updating project:', error);
    }
  };

  const updateHabit = async (habit: Habit) => {
    dispatch({ type: 'UPDATE_HABIT', payload: habit });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('habits').update({
        name: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        target_count: habit.targetCount,
        color: habit.color,
        completed_dates: habit.completedDates,
        streak: habit.streak,
      }).eq('id', habit.id).eq('user_id', user.id);
      if (error) console.error('Error updating habit:', error);
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    // Calculate the new state
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(date);
    const completedDates = isCompleted
      ? habit.completedDates.filter(d => d !== date)
      : [...habit.completedDates, date];
    const streak = calculateStreak(completedDates);

    // Update local state
    dispatch({ type: 'TOGGLE_HABIT', payload: { habitId, date } });

    // Sync to Supabase
    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('habits').update({
        completed_dates: completedDates,
        streak: streak,
      }).eq('id', habitId).eq('user_id', user.id);
      if (error) console.error('Error toggling habit:', error);
    }
  };

  const updateGoal = async (goal: Goal) => {
    dispatch({ type: 'UPDATE_GOAL', payload: goal });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('goals').update({
        title: goal.title,
        description: goal.description,
        target_date: goal.targetDate,
        progress: goal.progress,
        achieved: goal.achieved,
      }).eq('id', goal.id).eq('user_id', user.id);
      if (error) console.error('Error updating goal:', error);
    }
  };

  // ============ DELETE FUNCTIONS ============

  const deleteTask = async (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting task:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting event:', error);
    }
  };

  const deleteProject = async (id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting project:', error);
    }
  };

  const deleteHabit = async (id: string) => {
    dispatch({ type: 'DELETE_HABIT', payload: id });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting habit:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting goal:', error);
    }
  };

  // Note operations
  const addNote = async (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: NoteItem = {
      ...note,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_NOTE', payload: newNote });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('notes').insert({
        id: newNote.id,
        user_id: user.id,
        title: newNote.title,
        content: newNote.content,
        color: newNote.color,
        created_at: newNote.createdAt,
        updated_at: newNote.updatedAt,
      });
      if (error) console.error('Error adding note:', error);
    }
  };

  const updateNote = async (note: NoteItem) => {
    const updatedNote = { ...note, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_NOTE', payload: updatedNote });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('notes').update({
        title: updatedNote.title,
        content: updatedNote.content,
        color: updatedNote.color,
        updated_at: updatedNote.updatedAt,
      }).eq('id', note.id).eq('user_id', user.id);
      if (error) console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });

    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting note:', error);
    }
  };

  // Reminder operations
  const addReminder = (reminder: Omit<Reminder, 'id' | 'dismissed'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: uuidv4(),
      dismissed: false,
    };
    dispatch({ type: 'ADD_REMINDER', payload: newReminder });
  };

  const applyTemplate = (templateId: string) => {
    const template = state.templates.find(t => t.id === templateId);
    if (!template) return;
    
    template.tasks.forEach(taskTemplate => {
      addTask({
        title: taskTemplate.title || 'New Task',
        description: taskTemplate.description || '',
        status: 'todo',
        priority: taskTemplate.priority || 'medium',
        tags: taskTemplate.tags || [],
        dueDate: null,
        startDate: null,
        endDate: null,
        projectId: null,
        completedAt: null,
        assignee: null,
        color: '#3B82F6',
      });
    });
  };

  if (state.loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      // Task operations
      addTask,
      updateTask,
      deleteTask,
      // Event operations
      addEvent,
      updateEvent,
      deleteEvent,
      // Project operations
      addProject,
      updateProject,
      deleteProject,
      // Habit operations
      addHabit,
      updateHabit,
      toggleHabit,
      deleteHabit,
      // Goal operations
      addGoal,
      updateGoal,
      deleteGoal,
      // Note operations
      addNote,
      updateNote,
      deleteNote,
      // Reminder operations
      addReminder,
      // Template operations
      applyTemplate,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
