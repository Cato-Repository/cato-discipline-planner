-- Pre-MVP schema for Cato, following the draft data model in the product doc.
-- Auth is not wired up yet (no login UI in pre-MVP); user_id is a free-standing
-- uuid generated client-side per device until real Supabase Auth is introduced.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  subject text check (subject in ('computer-science', 'social-science-humanities', 'arts', 'other')),
  discipline_score integer not null default 50,
  streak_count integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  category text not null check (category in ('lecture', 'coding-project', 'problem-set', 'other')),
  deadline timestamptz not null,
  priority_tier text check (priority_tier in ('critical', 'high', 'medium', 'low')),
  status text not null default 'pending' check (status in ('pending', 'done')),
  source text not null check (source in ('user-added', 'suggested')),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists timetable_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  day text not null check (day in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  start_time time not null,
  end_time time not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists suggested_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  day text not null check (day in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists timetable_commitments_user_id_idx on timetable_commitments (user_id);
create index if not exists suggested_slots_user_id_idx on suggested_slots (user_id);
create index if not exists suggested_slots_task_id_idx on suggested_slots (task_id);

-- Row Level Security: locked down by default. Since there's no Supabase Auth
-- wired up in pre-MVP yet, these tables have no working policies -- all access
-- currently goes through the anon key from server-side code only. Add policies
-- once real auth (auth.uid()) is introduced.
alter table users enable row level security;
alter table tasks enable row level security;
alter table timetable_commitments enable row level security;
alter table suggested_slots enable row level security;
