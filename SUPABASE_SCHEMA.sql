-- SQL Script for Supabase Table Setup
-- Copy and run this in your Supabase SQL Editor

-- 1. Create the video_jobs table
create table if not exists public.video_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  tool text not null,
  progress integer default 0,
  status text check (status in ('queued', 'processing', 'completed', 'failed')) default 'queued',
  output_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.video_jobs enable row level security;

-- 3. Create RLS Policies
-- Policy: Users can view their own jobs
create policy "Users can see their own jobs" on public.video_jobs
  for select using (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
create policy "Users can insert their own jobs" on public.video_jobs
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own jobs
create policy "Users can update their own jobs" on public.video_jobs
  for update using (auth.uid() = user_id);

-- Policy: Users can delete their own jobs
create policy "Users can delete their own jobs" on public.video_jobs
  for delete using (auth.uid() = user_id);

-- 4. Set up Realtime
-- Enable Realtime for the video_jobs table to allow live updates in the dashboard
alter publication supabase_realtime add table video_jobs;
