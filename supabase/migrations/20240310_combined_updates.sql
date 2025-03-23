-- Combined migration for all 20240310 changes

-- Add default address trigger
-- Create function to set default address from coordinates
create or replace function set_default_address()
returns trigger as $$
begin
  -- Only set address if it's null and we have valid coordinates
  if new.address is null and new.location is not null then
    -- Format the coordinates into a readable address
    new.address := format(
      'Location at %.6f, %.6f',
      (new.location->>'lat')::float,
      (new.location->>'lng')::float
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically set address
create trigger set_default_address_trigger
  before insert or update
  on public.free_meetups
  for each row
  execute function set_default_address();

-- Add nearby meetups function
-- Create function to calculate radius based on zoom level and map bounds
create or replace function calculate_radius_from_zoom(
  zoom_level float,
  map_bounds jsonb default null
)
returns float as $$
declare
  base_radius float;
  viewport_radius float;
begin
  -- Base radius in meters at zoom level 13
  base_radius := 5000 * power(2, 13 - zoom_level);
  
  -- If map bounds are provided, calculate radius based on viewport
  if map_bounds is not null then
    -- Calculate the diagonal of the viewport in meters
    viewport_radius := ST_Distance(
      ST_SetSRID(ST_MakePoint(
        (map_bounds->>'west')::float,
        (map_bounds->>'south')::float
      ), 4326)::geography,
      ST_SetSRID(ST_MakePoint(
        (map_bounds->>'east')::float,
        (map_bounds->>'north')::float
      ), 4326)::geography
    ) / 2;
    
    -- Use the smaller of the two radii to ensure we don't miss nearby meetups
    return least(base_radius, viewport_radius);
  end if;
  
  return base_radius;
end;
$$ language plpgsql;

-- Create function to get nearby meetups with dynamic radius
create or replace function get_nearby_meetups(
  user_lat float,
  user_lng float,
  zoom_level float default 13,
  map_bounds jsonb default null,
  max_results integer default 50
)
returns table (
  id uuid,
  location jsonb,
  address text,
  distance_meters float,
  created_at timestamptz,
  expires_at timestamptz,
  status text,
  bearing float, -- Direction from user to meetup
  is_within_viewport boolean -- Whether the meetup is within the current map viewport
) as $$
declare
  radius_meters float;
  viewport_geometry geometry;
begin
  -- Calculate radius based on zoom level and map bounds
  radius_meters := calculate_radius_from_zoom(zoom_level, map_bounds);
  
  -- Create viewport geometry if bounds are provided
  if map_bounds is not null then
    viewport_geometry := ST_MakeEnvelope(
      (map_bounds->>'west')::float,
      (map_bounds->>'south')::float,
      (map_bounds->>'east')::float,
      (map_bounds->>'north')::float,
      4326
    );
  end if;
  
  return query
  with meetup_locations as (
    select 
      id,
      location,
      address,
      created_at,
      expires_at,
      status,
      -- Calculate distance using PostGIS (in meters)
      ST_Distance(
        ST_SetSRID(ST_MakePoint(
          (location->>'lng')::float,
          (location->>'lat')::float
        ), 4326)::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) as distance_meters,
      -- Calculate bearing (direction) from user to meetup
      ST_Azimuth(
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(
          (location->>'lng')::float,
          (location->>'lat')::float
        ), 4326)::geography
      ) * 180 / pi() as bearing,
      -- Check if meetup is within viewport
      case 
        when map_bounds is not null then
          ST_Contains(
            viewport_geometry,
            ST_SetSRID(ST_MakePoint(
              (location->>'lng')::float,
              (location->>'lat')::float
            ), 4326)
          )
        else null
      end as is_within_viewport
    from public.free_meetups
    where status = 'active'
      and expires_at > now()
      -- Use ST_DWithin for more efficient spatial filtering
      and ST_DWithin(
        ST_SetSRID(ST_MakePoint(
          (location->>'lng')::float,
          (location->>'lat')::float
        ), 4326)::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_meters
      )
  )
  select 
    id,
    location,
    address,
    distance_meters,
    created_at,
    expires_at,
    status,
    bearing,
    is_within_viewport
  from meetup_locations
  order by 
    -- Prioritize meetups within viewport
    case when is_within_viewport then 0 else 1 end,
    -- Then by distance
    distance_meters asc
  limit max_results;
end;
$$ language plpgsql;

-- Create index to optimize spatial queries
create index if not exists free_meetups_location_idx 
on public.free_meetups 
using gist ((
  ST_SetSRID(ST_MakePoint(
    (location->>'lng')::float,
    (location->>'lat')::float
  ), 4326)
));

-- Create index for active meetups
create index if not exists free_meetups_active_idx 
on public.free_meetups (status, expires_at)
where status = 'active';

-- Create function to get meetup density in an area
create or replace function get_meetup_density(
  center_lat float,
  center_lng float,
  radius_meters float
)
returns table (
  total_meetups integer,
  density_per_sqkm float,
  average_distance float,
  max_distance float,
  min_distance float
) as $$
begin
  return query
  with area_stats as (
    select 
      count(*) as total,
      -- Calculate area in square kilometers
      ST_Area(
        ST_Buffer(
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
          radius_meters
        )::geography
      ) / 1000000 as area_sqkm,
      -- Calculate average distance
      avg(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(
            (location->>'lng')::float,
            (location->>'lat')::float
          ), 4326)::geography,
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        )
      ) as avg_dist,
      -- Calculate max distance
      max(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(
            (location->>'lng')::float,
            (location->>'lat')::float
          ), 4326)::geography,
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        )
      ) as max_dist,
      -- Calculate min distance
      min(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(
            (location->>'lng')::float,
            (location->>'lat')::float
          ), 4326)::geography,
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        )
      ) as min_dist
    from public.free_meetups
    where status = 'active'
      and expires_at > now()
      and ST_DWithin(
        ST_SetSRID(ST_MakePoint(
          (location->>'lng')::float,
          (location->>'lat')::float
        ), 4326)::geography,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_meters
      )
  )
  select 
    total::integer,
    (total / area_sqkm)::float,
    avg_dist::float,
    max_dist::float,
    min_dist::float
  from area_stats;
end;
$$ language plpgsql;

-- Create function to create free meetups
create or replace function create_free_meetup(
  p_location jsonb,
  p_address text,
  p_title text default 'Instant Meetup',
  p_description text default null,
  p_image text default null,
  p_status text default 'active'
)
returns uuid as $$
declare
  v_id uuid;
  v_expires_at timestamptz;
begin
  -- Set expiration to 24 hours from now
  v_expires_at := now() + interval '24 hours';
  
  -- Insert the meetup
  insert into public.free_meetups (
    location,
    address,
    title,
    description,
    image,
    status,
    expires_at
  ) values (
    p_location,
    p_address,
    p_title,
    p_description,
    p_image,
    p_status,
    v_expires_at
  )
  returning id into v_id;
  
  return v_id;
end;
$$ language plpgsql security definer;

-- Enable RLS on free_meetups table
alter table public.free_meetups enable row level security;

-- Drop existing policies
drop policy if exists "Anyone can read active free meetups" on public.free_meetups;
drop policy if exists "Anyone can create free meetups" on public.free_meetups;
drop policy if exists "Anyone can update meetup status" on public.free_meetups;

-- Create policies for free_meetups
create policy "Anyone can read active free meetups"
  on public.free_meetups
  for select
  using (status = 'active' and expires_at > now());

create policy "Anyone can create free meetups"
  on public.free_meetups
  for insert
  with check (true);

create policy "Anyone can update meetup status"
  on public.free_meetups
  for update
  using (true)
  with check (true);

-- Grant necessary permissions to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all on public.free_meetups to anon, authenticated;
grant execute on function create_free_meetup to anon, authenticated;
grant execute on function get_nearby_meetups to anon, authenticated;
grant execute on function get_meetup_density to anon, authenticated; 