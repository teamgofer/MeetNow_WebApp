-- Create an anonymous role if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_roles where rolname = 'anon'
  ) then
    create role anon;
  end if;
end $$;

-- Update RLS policies for free_meetups to allow anonymous access
drop policy if exists "Anyone can create free meetups" on public.free_meetups;
drop policy if exists "Anyone can read active free meetups" on public.free_meetups;
drop policy if exists "Allow anonymous and authenticated users to create free meetups" on public.free_meetups;
drop policy if exists "Allow anonymous and authenticated users to read active free meetups" on public.free_meetups;
drop policy if exists "Allow anonymous and authenticated users to update meetup status" on public.free_meetups;

-- Create policies that work with anonymous access
create policy "Allow anonymous read access"
  on public.free_meetups
  for select
  to anon
  using (
    status = 'active' and
    expires_at > now()
  );

create policy "Allow anonymous create access"
  on public.free_meetups
  for insert
  to anon
  with check (
    status = 'active'
  );

create policy "Allow anonymous update access"
  on public.free_meetups
  for update
  to anon
  using (status = 'active')
  with check (status in ('cancelled', 'expired')); 