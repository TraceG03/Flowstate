# Flowstate - Setup & Deployment Guide

## 🚀 Quick Start (Demo Mode)

Run locally without Supabase:
```bash
npm install
npm run dev
```

The app works in demo mode with localStorage - no authentication required.

---

## 📦 Full Deployment with Supabase + Vercel + GitHub

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up
3. Go to **Settings > API** and copy:
   - `Project URL` 
   - `anon/public` key

### Step 2: Set Up Database

In Supabase, go to **SQL Editor** and run this script:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  tags text[] default '{}',
  due_date timestamp with time zone,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  project_id uuid,
  completed_at timestamp with time zone,
  color text default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table
create table events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  all_day boolean default false,
  color text default '#6366f1',
  recurring text default 'none' check (recurring in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  reminder integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects table
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text default '#6366f1',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habits table
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  frequency text default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  target_count integer default 1,
  color text default '#6366f1',
  completed_dates date[] default '{}',
  streak integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goals table
create table goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  target_date timestamp with time zone,
  progress integer default 0,
  achieved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Milestones table
create table milestones (
  id uuid default uuid_generate_v4() primary key,
  goal_id uuid references goals on delete cascade not null,
  title text not null,
  completed boolean default false,
  completed_at timestamp with time zone
);

-- Channels table
create table channels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references channels on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notes table
create table notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text,
  color text default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weekly reviews table
create table weekly_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_start date not null,
  week_end date not null,
  insights text[] default '{}',
  next_week_focus text[] default '{}',
  rating integer default 3,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table projects enable row level security;
alter table habits enable row level security;
alter table goals enable row level security;
alter table milestones enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;
alter table notes enable row level security;
alter table weekly_reviews enable row level security;

-- RLS Policies (users can only access their own data)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can manage own tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users can manage own events" on events for all using (auth.uid() = user_id);
create policy "Users can manage own projects" on projects for all using (auth.uid() = user_id);
create policy "Users can manage own habits" on habits for all using (auth.uid() = user_id);
create policy "Users can manage own goals" on goals for all using (auth.uid() = user_id);
create policy "Users can manage own channels" on channels for all using (auth.uid() = user_id);
create policy "Users can manage own notes" on notes for all using (auth.uid() = user_id);
create policy "Users can manage own reviews" on weekly_reviews for all using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Flowstate productivity app"
git remote add origin https://github.com/YOUR_USERNAME/flowstate.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your `flowstate` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

6. Click **Deploy**!

### Step 6: Configure Auth Redirects

In Supabase dashboard:
1. Go to **Authentication > URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/**`

---

## 🔐 Optional: Enable Google OAuth

1. In Supabase: **Authentication > Providers > Google**
2. Create credentials at [Google Cloud Console](https://console.cloud.google.com)
3. Add the client ID and secret to Supabase
4. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

---

## 📁 Project Structure

```
ProductivityApp/
├── src/
│   ├── components/     # React components
│   ├── context/        # State management
│   ├── lib/            # Supabase config
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── .gitignore
├── vercel.json         # Vercel config
├── vite.config.js
└── package.json
```

---

## 🎉 You're Done!

Your Flowstate app is now deployed with:
- ✅ User authentication
- ✅ Cloud data storage
- ✅ Automatic deployments on push
- ✅ Cross-platform access
