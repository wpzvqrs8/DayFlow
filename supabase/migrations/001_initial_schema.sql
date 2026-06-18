-- Drop tables if they already exist
drop table if exists daily_reports cascade;
drop table if exists tasks cascade;
drop table if exists daily_notes cascade;
drop table if exists app_config cascade;

-- Create app_config table
create table app_config (
  id integer primary key default 1,
  password_hash varchar(255) not null,
  setup_complete boolean default false,
  default_tasks text[] default array['Morning Routine', 'Deep Work Block', 'Exercise / Movement', 'Reading / Learning', 'Evening Review'],
  created_at timestamptz default now()
);

-- Ensure only one row can exist in app_config
alter table app_config add constraint only_one_row check (id = 1);

-- Create daily_reports table
create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  score integer check (score >= 0 and score <= 100) default 50,
  accomplishments text,
  challenges text,
  reflections text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  is_default boolean default false,
  date date not null,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Create daily_notes table
create table daily_notes (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table app_config enable row level security;
alter table daily_reports enable row level security;
alter table tasks enable row level security;
alter table daily_notes enable row level security;

-- Create permissive policies for service role (permissive for all, since server side handles JWT validation)
-- In Supabase, the service_role key bypasses RLS completely, but let's add full control policies for authenticated users if we ever use user-based clients
create policy "Allow all operations for service role" on app_config for all using (true) with check (true);
create policy "Allow all operations for service role" on daily_reports for all using (true) with check (true);
create policy "Allow all operations for service role" on tasks for all using (true) with check (true);
create policy "Allow all operations for service role" on daily_notes for all using (true) with check (true);

-- Insert initial record for app_config to represent first-run state
insert into app_config (id, password_hash, setup_complete) values (1, '', false)
on conflict (id) do nothing;
