export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type ViewType = 'list' | 'kanban' | 'timeline' | 'agenda' | 'calendar' | 'gantt';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  startDate: string | null;
  endDate: string | null;
  timeBlocks: TimeBlock[];
  projectId: string | null;
  notes: Note[];
  createdAt: string;
  completedAt: string | null;
  assignee: string | null;
  color: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder: number | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  tasks: string[];
  startDate: string;
  endDate: string;
  progress: number;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  color: string;
  completedDates: string[];
  streak: number;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  milestones: Milestone[];
  achieved: boolean;
}

export interface Message {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  attachments: string[];
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  color: string;
  messages: Message[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  tasks: Partial<Task>[];
  category: string;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  dateTime: string;
  taskId: string | null;
  eventId: string | null;
  dismissed: boolean;
}

export interface Analytics {
  completedTasks: number;
  missedDeadlines: number;
  productivityScore: number;
  tasksByPriority: Record<Priority, number>;
  tasksByStatus: Record<TaskStatus, number>;
  dailyCompletions: { date: string; count: number }[];
  habitStreaks: { habitId: string; streak: number }[];
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  completedGoals: string[];
  insights: string[];
  nextWeekFocus: string[];
  rating: number;
  notes: string;
}
