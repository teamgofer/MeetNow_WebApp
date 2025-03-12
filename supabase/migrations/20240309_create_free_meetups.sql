-- Create extensions if not exists
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create function to calculate expiration time
create or replace function calculate_expiration_time(creation_time timestamp with time zone)
returns timestamp with time zone as $$
begin
  return creation_time + interval '1 hour';
end;
$$ language plpgsql;

-- Create free_meetups table
create table if not exists public.free_meetups (
  -- Primary identifier
  id uuid default uuid_generate_v4() primary key,
  
  -- Location information (required)
  location jsonb not null check (
    jsonb_typeof(location->'lat') = 'number' and 
    jsonb_typeof(location->'lng') = 'number' and
    (location->>'lat')::float between -90 and 90 and
    (location->>'lng')::float between -180 and 180
  ),
  address varchar(500),
  
  -- Time information (required)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null default timezone('utc'::text, now()) + interval '1 hour',
  
  -- Status
  status varchar(20) default 'active' not null check (status in ('active', 'expired', 'cancelled')),

  -- Ensure expires_at is always 1 hour after created_at
  constraint valid_expiration check (
    expires_at = created_at + interval '1 hour'
  )
);

-- Create trigger function to set expires_at
create or replace function set_expires_at()
returns trigger as $$
begin
  new.expires_at := new.created_at + interval '1 hour';
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically set expires_at
create trigger set_expires_at_trigger
  before insert or update
  on public.free_meetups
  for each row
  execute function set_expires_at();

-- Create indexes for better query performance
create index free_meetups_location_idx on public.free_meetups using gin(location);
create index free_meetups_created_at_idx on public.free_meetups(created_at);
create index free_meetups_expires_at_idx on public.free_meetups(expires_at);
create index free_meetups_status_idx on public.free_meetups(status);

-- Enable Row Level Security
alter table public.free_meetups enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can read active free meetups" on public.free_meetups;
drop policy if exists "Anyone can create free meetups" on public.free_meetups;
drop policy if exists "Anyone can update meetup status" on public.free_meetups;

-- Create policies for access control
create policy "Anyone can read active free meetups"
  on public.free_meetups
  for select
  to public
  using (true);  -- Allow reading all meetups

create policy "Anyone can create free meetups"
  on public.free_meetups
  for insert
  to public
  with check (
    status = 'active'
  );

create policy "Anyone can update meetup status"
  on public.free_meetups
  for update
  to public
  using (status = 'active')
  with check (status in ('cancelled', 'expired'));

-- Create function to automatically expire meetups
create or replace function cleanup_expired_free_meetups()
returns void as $$
begin
  update public.free_meetups
  set status = 'expired'
  where status = 'active'
    and expires_at <= timezone('utc'::text, now());
end;
$$ language plpgsql;

-- Create a scheduled job to run cleanup every minute
select cron.schedule(
  'cleanup-expired-free-meetups',
  '* * * * *', -- Every minute
  $$
    select cleanup_expired_free_meetups();
  $$
); 