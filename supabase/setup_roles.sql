-- Create roles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.meetups TO anon, authenticated;
GRANT ALL ON public.meetup_participants TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text) TO anon, authenticated; 