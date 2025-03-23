-- Repair script to fix partially imported schema

-- First, let's create a function to safely execute SQL commands
-- This prevents errors when running the script multiple times
DO $repair_script$
DECLARE
    table_exists boolean;
    type_exists boolean;
    column_exists boolean;
    extension_exists boolean;
    function_exists boolean;
    schema_exists boolean;
BEGIN
    -- Create extensions if they don't exist
    SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') INTO extension_exists;
    IF NOT extension_exists THEN
        CREATE EXTENSION IF NOT EXISTS "postgis";
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') INTO extension_exists;
    IF NOT extension_exists THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Ensure cron schema exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron'
    ) INTO schema_exists;
    
    IF NOT schema_exists THEN
        CREATE SCHEMA IF NOT EXISTS cron;
        RAISE NOTICE 'Created cron schema, but pg_cron extension might not be available';
    END IF;
    
    -- Try to create pg_cron extension, but treat as optional
    BEGIN
        SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO extension_exists;
        IF NOT extension_exists THEN
            BEGIN
                CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;
                RAISE NOTICE 'Successfully installed pg_cron extension';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not create pg_cron extension. This is OK - we will use a fallback method for cleanup.';
            END;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error checking pg_cron status: %', SQLERRM;
    END;

    -- Ensure auth schema exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
    ) INTO schema_exists;
    
    IF NOT schema_exists THEN
        CREATE SCHEMA IF NOT EXISTS auth;
    END IF;

    -- Create auth.role() function if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION auth.role()
        RETURNS text
        LANGUAGE sql
        STABLE
        AS $$
            SELECT 'authenticated'::text;
        $$;
        
        RAISE NOTICE 'Created mock auth.role() function that always returns "authenticated"';
    END IF;
    
    -- Create auth.uid() function if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'uid' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION auth.uid()
        RETURNS uuid
        LANGUAGE sql
        STABLE
        AS $$
            SELECT '00000000-0000-0000-0000-000000000000'::uuid;
        $$;
        
        RAISE NOTICE 'Created mock auth.uid() function that always returns a dummy UUID';
    END IF;

    -- Ensure storage schema exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
    ) INTO schema_exists;
    
    IF NOT schema_exists THEN
        CREATE SCHEMA IF NOT EXISTS storage;
    END IF;
    
    -- Create auth.users if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        CREATE TABLE IF NOT EXISTS auth.users (
            id uuid primary key,
            email text unique,
            created_at timestamptz default now(),
            updated_at timestamptz default now()
        );
    END IF;
    
    -- Create storage.buckets if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        CREATE TABLE IF NOT EXISTS storage.buckets (
            id text primary key,
            name text not null,
            created_at timestamptz default now()
        );
    END IF;
    
    -- Create storage.objects if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        CREATE TABLE IF NOT EXISTS storage.objects (
            id uuid primary key default uuid_generate_v4(),
            bucket_id text references storage.buckets(id),
            name text,
            owner uuid,
            created_at timestamptz default now(),
            updated_at timestamptz default now(),
            metadata jsonb default '{}'::jsonb
        );
    END IF;
    
    -- Create storage bucket for meetup images
    INSERT INTO storage.buckets (id, name) 
    VALUES ('meetup-images', 'Meetup Images')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create meetup_status enum type if not exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'meetup_status'
    ) INTO type_exists;
    
    IF NOT type_exists THEN
        CREATE TYPE meetup_status AS ENUM ('active', 'expired', 'cancelled');
    END IF;
    
    -- Create profiles table if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        CREATE TABLE public.profiles (
            id uuid primary key references auth.users(id) on delete cascade,
            username text unique,
            display_name text,
            avatar_url text,
            bio text,
            created_at timestamptz default now(),
            updated_at timestamptz default now()
        );
    END IF;
    
    -- Create meetups table if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meetups'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        CREATE TABLE public.meetups (
            id uuid primary key default uuid_generate_v4(),
            creator_id uuid references auth.users(id) on delete cascade,
            title text not null,
            description text,
            location geography(Point, 4326) not null,
            address text,
            image_url text,
            created_at timestamptz default now(),
            updated_at timestamptz default now(),
            max_participants integer default 10,
            current_participants integer default 1,
            expires_at timestamptz not null,
            status meetup_status default 'active'
        );
        
        -- Create index for geospatial queries
        CREATE INDEX meetups_location_idx ON public.meetups USING GIST (location);
        CREATE INDEX meetups_status_idx ON public.meetups (status);
        CREATE INDEX meetups_expires_at_idx ON public.meetups (expires_at);
    END IF;
    
    -- Create meetup_participants table if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meetup_participants'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        CREATE TABLE public.meetup_participants (
            id uuid primary key default uuid_generate_v4(),
            meetup_id uuid references public.meetups(id) on delete cascade,
            user_id uuid references auth.users(id) on delete cascade,
            joined_at timestamptz default now(),
            UNIQUE(meetup_id, user_id)
        );
        
        CREATE INDEX meetup_participants_meetup_id_idx ON public.meetup_participants (meetup_id);
        CREATE INDEX meetup_participants_user_id_idx ON public.meetup_participants (user_id);
    END IF;
    
    -- Create nearby_meetups function if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'nearby_meetups'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION public.nearby_meetups(
            lat double precision,
            lng double precision,
            radius_meters integer DEFAULT 5000,
            max_results integer DEFAULT 100
        )
        RETURNS SETOF public.meetups
        LANGUAGE sql
        STABLE
        AS $nearby_meetups$
            SELECT m.*
            FROM public.meetups m
            WHERE ST_DWithin(
                m.location,
                ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
                radius_meters
            )
            AND m.status = 'active'
            AND m.expires_at > now()
            ORDER BY ST_Distance(
                m.location,
                ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
            )
            LIMIT max_results;
        $nearby_meetups$;
    END IF;
    
    -- Create handle_new_participant function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'handle_new_participant'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION public.handle_new_participant()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $handle_new_participant$
        BEGIN
            -- Increment the current_participants count
            UPDATE public.meetups
            SET current_participants = current_participants + 1
            WHERE id = NEW.meetup_id;
            
            RETURN NEW;
        END;
        $handle_new_participant$;
    END IF;
    
    -- Create handle_participant_left function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'handle_participant_left'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION public.handle_participant_left()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $handle_participant_left$
        BEGIN
            -- Decrement the current_participants count
            UPDATE public.meetups
            SET current_participants = current_participants - 1
            WHERE id = OLD.meetup_id;
            
            RETURN OLD;
        END;
        $handle_participant_left$;
    END IF;
    
    -- Create cleanup_expired_meetups function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_meetups'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION public.cleanup_expired_meetups()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $cleanup_expired_meetups$
        BEGIN
            -- Update expired meetups
            UPDATE public.meetups
            SET status = 'expired'
            WHERE status = 'active'
            AND expires_at <= now();
        END;
        $cleanup_expired_meetups$;
    END IF;
    
    -- Create create_meetup function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'create_meetup'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE OR REPLACE FUNCTION create_meetup(
            p_creator_id uuid,
            p_title text,
            p_description text,
            p_location text, -- WKT POINT string
            p_address text default null,
            p_image_url text default null,
            p_max_participants int default 10,
            p_expires_at timestamptz default now() + interval '1 day'
        )
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $create_meetup$
        DECLARE
            new_meetup_id uuid;
            new_meetup jsonb;
        BEGIN
            -- Insert the new meetup
            INSERT INTO public.meetups (
                creator_id,
                title,
                description,
                location,
                address,
                image_url,
                max_participants,
                expires_at
            ) VALUES (
                p_creator_id,
                p_title,
                p_description,
                ST_GeogFromText(p_location),
                p_address,
                p_image_url,
                p_max_participants,
                p_expires_at
            )
            RETURNING id INTO new_meetup_id;
            
            -- Add the creator as a participant
            INSERT INTO public.meetup_participants (
                meetup_id,
                user_id
            ) VALUES (
                new_meetup_id,
                p_creator_id
            );
            
            -- Get the full meetup data
            SELECT jsonb_build_object(
                'id', m.id,
                'creator_id', m.creator_id,
                'title', m.title,
                'description', m.description,
                'location', ST_AsGeoJSON(m.location)::jsonb,
                'address', m.address,
                'image_url', m.image_url,
                'created_at', m.created_at,
                'updated_at', m.updated_at,
                'max_participants', m.max_participants,
                'current_participants', m.current_participants,
                'expires_at', m.expires_at,
                'status', m.status
            )
            FROM public.meetups m
            WHERE m.id = new_meetup_id
            INTO new_meetup;
            
            RETURN new_meetup;
        END;
        $create_meetup$;
    END IF;
    
    -- Create triggers if they don't exist
    
    -- Check if on_participant_added trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_participant_added' 
        AND tgrelid = 'public.meetup_participants'::regclass
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE TRIGGER on_participant_added
            AFTER INSERT ON public.meetup_participants
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_participant();
    END IF;
    
    -- Check if on_participant_left trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_participant_left' 
        AND tgrelid = 'public.meetup_participants'::regclass
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        CREATE TRIGGER on_participant_left
            AFTER DELETE ON public.meetup_participants
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_participant_left();
    END IF;
    
    -- Enable RLS on tables
    ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.meetups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.meetup_participants ENABLE ROW LEVEL SECURITY;
    
    -- Create storage policies
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'meetup-images');
    
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    CREATE POLICY "Authenticated users can upload images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'meetup-images' AND auth.role() = 'authenticated');
    
    -- Create table policies
    -- Profiles policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone"
        ON public.profiles FOR SELECT
        USING (true);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
    
    -- Meetups policies
    DROP POLICY IF EXISTS "Meetups are viewable by everyone" ON public.meetups;
    CREATE POLICY "Meetups are viewable by everyone"
        ON public.meetups FOR SELECT
        USING (true);
    
    DROP POLICY IF EXISTS "Authenticated users can create meetups" ON public.meetups;
    CREATE POLICY "Authenticated users can create meetups"
        ON public.meetups FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    
    DROP POLICY IF EXISTS "Creators can update their meetups" ON public.meetups;
    CREATE POLICY "Creators can update their meetups"
        ON public.meetups FOR UPDATE
        USING (auth.uid() = creator_id);
    
    DROP POLICY IF EXISTS "Creators can delete their meetups" ON public.meetups;
    CREATE POLICY "Creators can delete their meetups"
        ON public.meetups FOR DELETE
        USING (auth.uid() = creator_id);
    
    -- Meetup participants policies
    DROP POLICY IF EXISTS "Participants are viewable by everyone" ON public.meetup_participants;
    CREATE POLICY "Participants are viewable by everyone"
        ON public.meetup_participants FOR SELECT
        USING (true);
    
    DROP POLICY IF EXISTS "Authenticated users can join meetups" ON public.meetup_participants;
    CREATE POLICY "Authenticated users can join meetups"
        ON public.meetup_participants FOR INSERT
        WITH CHECK (
            auth.role() = 'authenticated'
            AND EXISTS (
                SELECT 1 FROM public.meetups m
                WHERE m.id = meetup_id
                AND m.status = 'active'
                AND m.expires_at > now()
                AND m.current_participants < m.max_participants
            )
        );
    
    DROP POLICY IF EXISTS "Users can leave meetups" ON public.meetup_participants;
    CREATE POLICY "Users can leave meetups"
        ON public.meetup_participants FOR DELETE
        USING (auth.uid() = user_id);
    
    -- Schedule cleanup job if cron extension is available
    BEGIN
        -- Check if cron.job table exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'cron' AND table_name = 'job'
        ) INTO table_exists;
        
        -- Only proceed if cron.job table exists
        IF table_exists THEN
            -- Try to create or update cron job
            BEGIN
                -- Try to unschedule if it exists
                BEGIN
                    PERFORM cron.unschedule('cleanup-expired-meetups');
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore error if it doesn't exist
                END;
                
                -- Schedule the job
                PERFORM cron.schedule(
                    'cleanup-expired-meetups',
                    '*/5 * * * *',  -- Every 5 minutes
                    $cron_job$
                    SELECT public.cleanup_expired_meetups();
                    $cron_job$
                );
                
                RAISE NOTICE 'Successfully scheduled cleanup job with pg_cron';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not schedule cleanup job with pg_cron: %', SQLERRM;
                RAISE NOTICE 'Creating a fallback cleanup function that you can manually run';
                
                -- Create fallback manual cleanup function
                PERFORM 1;  -- Dummy statement to avoid syntax error
            END;
        ELSE
            RAISE NOTICE 'The cron.job table does not exist. Creating a fallback cleanup function.';
            -- Dummy statement to avoid syntax error
            PERFORM 1;
        END IF;
        
        -- Always create the manual cleanup function as a fallback
        CREATE OR REPLACE FUNCTION public.manual_cleanup_expired_meetups()
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $manual_cleanup$
        DECLARE
            cleanup_count integer;
        BEGIN
            WITH updated AS (
                UPDATE public.meetups
                SET status = 'expired'
                WHERE status = 'active'
                AND expires_at <= now()
                RETURNING id
            )
            SELECT count(*) INTO cleanup_count FROM updated;
            
            RETURN 'Cleaned up ' || cleanup_count || ' expired meetups. Run this function regularly to keep your database clean.';
        END;
        $manual_cleanup$;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error with cron scheduling: %', SQLERRM;
        RAISE NOTICE 'This is not critical - expired meetups will be filtered out by the application code.';
    END;
    
END $repair_script$; 