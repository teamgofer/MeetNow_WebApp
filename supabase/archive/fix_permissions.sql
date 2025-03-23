-- Enable Row Level Security
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active meetups" ON public.meetups;
DROP POLICY IF EXISTS "Allow authenticated users to create meetups" ON public.meetups;
DROP POLICY IF EXISTS "Allow creators to update their meetups" ON public.meetups;
DROP POLICY IF EXISTS "Allow creators to delete their meetups" ON public.meetups;

-- Create policies for the meetups table
CREATE POLICY "Allow public read access to active meetups"
ON public.meetups
FOR SELECT
TO public
USING (true);  -- This allows anyone to read all meetups

CREATE POLICY "Allow authenticated users to create meetups"
ON public.meetups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Allow creators to update their meetups"
ON public.meetups
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Allow creators to delete their meetups"
ON public.meetups
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Enable RLS on the meetup_participants table
ALTER TABLE public.meetup_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to participants" ON public.meetup_participants;
DROP POLICY IF EXISTS "Allow authenticated users to join meetups" ON public.meetup_participants;
DROP POLICY IF EXISTS "Allow participants to leave meetups" ON public.meetup_participants;

-- Create policies for the meetup_participants table
CREATE POLICY "Allow public read access to participants"
ON public.meetup_participants
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to join meetups"
ON public.meetup_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow participants to leave meetups"
ON public.meetup_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions to the anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.meetups TO anon, authenticated;
GRANT SELECT ON public.meetup_participants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.meetups TO authenticated;
GRANT INSERT, DELETE ON public.meetup_participants TO authenticated;
GRANT USAGE ON SEQUENCE meetups_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE meetup_participants_id_seq TO authenticated; 