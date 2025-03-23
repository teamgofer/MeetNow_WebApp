-- Function to create a meetup with PostGIS point
create or replace function create_meetup(
  p_creator_id uuid,
  p_title text,
  p_description text,
  p_location text, -- WKT POINT string
  p_address text default null,
  p_image_url text default null,
  p_max_participants int default 10,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
as $$
declare
  new_meetup_id uuid;
  new_meetup jsonb;
begin
  -- Insert the new meetup
  insert into public.meetups (
    creator_id,
    title,
    description,
    location,
    address,
    image_url,
    status,
    max_participants,
    current_participants,
    expires_at
  ) values (
    p_creator_id,
    p_title,
    p_description,
    ST_GeogFromText(p_location), -- Convert WKT to geography
    p_address,
    p_image_url,
    'active',
    p_max_participants,
    1, -- Creator is first participant
    p_expires_at
  )
  returning id into new_meetup_id;
  
  -- Add creator as first participant
  insert into public.meetup_participants (
    meetup_id,
    user_id
  ) values (
    new_meetup_id,
    p_creator_id
  );
  
  -- Get the created meetup with creator info
  select 
    jsonb_build_object(
      'id', m.id,
      'creator_id', m.creator_id,
      'title', m.title,
      'description', m.description,
      'location', jsonb_build_object(
        'lng', ST_X(m.location::geometry),
        'lat', ST_Y(m.location::geometry)
      ),
      'address', m.address,
      'image_url', m.image_url,
      'status', m.status,
      'max_participants', m.max_participants,
      'current_participants', m.current_participants,
      'created_at', m.created_at,
      'expires_at', m.expires_at,
      'creator_name', p.username
    )
  from 
    public.meetups m
    join public.profiles p on m.creator_id = p.id
  where 
    m.id = new_meetup_id
  into new_meetup;
  
  return new_meetup;
end;
$$; 