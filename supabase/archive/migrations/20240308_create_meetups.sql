-- Create extensions if not exists
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create meetups table with comprehensive columns
create table if not exists public.meetups (
  -- Primary identifier
  id uuid default uuid_generate_v4() primary key,
  
  -- User information (optional for unauthenticated users)
  user_id uuid references auth.users(id) null,
  user_profile jsonb not null, -- Stores bio, image, etc.
  
  -- Location information
  location jsonb not null, -- Stores lat/lng
  address text, -- Formatted address
  place_name text, -- Optional name of the place
  
  -- Time information
  created_at timestamp with time zone default timezone('utc'::text, now()),
  availability text not null, -- When the user is available
  start_time timestamp with time zone not null, -- Specific start time
  end_time timestamp with time zone not null, -- Specific end time (1 hour after start)
  
  -- Status information
  status text default 'active' check (status in ('active', 'cancelled', 'completed')),
  
  -- Boost/Premium features
  boost boolean default false,
  boost_expires_at timestamp with time zone,
  
  -- Additional metadata
  description text, -- Optional meetup description
  
  -- Timestamps
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  deleted_at timestamp with time zone -- Soft delete support
);

-- Create indexes for better query performance
create index meetups_created_at_idx on public.meetups(created_at);
create index meetups_status_idx on public.meetups(status);
create index meetups_location_idx on public.meetups using gin(location);

-- Add a trigger to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_meetups_updated_at
  before update on public.meetups
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security
alter table public.meetups enable row level security;

-- Create policies for access control
create policy "Anyone can read active meetups"
  on public.meetups for select
  using (status = 'active' and deleted_at is null);

create policy "Anyone can create basic meetups"
  on public.meetups for insert
  with check (
    user_id is null and
    (end_time - start_time) = interval '1 hour' and
    boost = false
  );

create policy "Users can update their own meetups"
  on public.meetups for update
  using (
    (auth.uid() = user_id and user_id is not null) or
    (user_id is null and created_at > now() - interval '1 hour')
  )
  with check (status in ('active', 'cancelled'));

create policy "Users can delete their own meetups"
  on public.meetups for delete
  using (
    (auth.uid() = user_id and user_id is not null) or
    (user_id is null and created_at > now() - interval '1 hour')
  );

-- Create function to clean up expired meetups
create or replace function cleanup_expired_meetups()
returns void as $$
begin
  update public.meetups
  set status = 'completed'
  where status = 'active'
    and end_time < timezone('utc'::text, now());
end;
$$ language plpgsql;

-- Attempt to schedule cleanup job if pg_cron is available
DO $do$
BEGIN
  -- Check if pg_cron extension exists and is available
  IF EXISTS (
    SELECT 1 
    FROM pg_available_extensions 
    WHERE name = 'pg_cron' 
    AND installed_version IS NOT NULL
  ) THEN
    -- Create cron schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS cron;
    
    -- Create a scheduled job to run cleanup every hour
    PERFORM cron.schedule(
      'cleanup-expired-meetups',
      '0 * * * *', -- Every hour
      $func$
        select cleanup_expired_meetups();
      $func$
    );
    
    RAISE NOTICE 'pg_cron job scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Manual cleanup will be required';
  END IF;
END $do$; 