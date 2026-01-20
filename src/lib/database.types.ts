export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'review' | 'done';
          priority: 'urgent' | 'high' | 'medium' | 'low';
          tags: string[];
          due_date: string | null;
          start_date: string | null;
          end_date: string | null;
          project_id: string | null;
          completed_at: string | null;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'urgent' | 'high' | 'medium' | 'low';
          tags?: string[];
          due_date?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          project_id?: string | null;
          completed_at?: string | null;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'urgent' | 'high' | 'medium' | 'low';
          tags?: string[];
          due_date?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          project_id?: string | null;
          completed_at?: string | null;
          color?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          all_day: boolean;
          color: string;
          recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
          reminder: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          all_day?: boolean;
          color?: string;
          recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
          reminder?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          all_day?: boolean;
          color?: string;
          recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
          reminder?: number | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          start_date: string | null;
          end_date: string | null;
          progress: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number;
          created_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          frequency: 'daily' | 'weekly' | 'monthly';
          target_count: number;
          color: string;
          completed_dates: string[];
          streak: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly';
          target_count?: number;
          color?: string;
          completed_dates?: string[];
          streak?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly';
          target_count?: number;
          color?: string;
          completed_dates?: string[];
          streak?: number;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          progress: number;
          achieved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          progress?: number;
          achieved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_date?: string | null;
          progress?: number;
          achieved?: boolean;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          goal_id: string;
          title: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          goal_id: string;
          title: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          goal_id?: string;
          title?: string;
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      channels: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      weekly_reviews: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          week_end: string;
          insights: string[];
          next_week_focus: string[];
          rating: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          week_end: string;
          insights?: string[];
          next_week_focus?: string[];
          rating?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          week_end?: string;
          insights?: string[];
          next_week_focus?: string[];
          rating?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
