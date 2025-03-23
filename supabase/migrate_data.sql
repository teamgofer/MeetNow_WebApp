-- Migration script for existing data
-- This will migrate data from free_meetups or old meetups table to the new schema

DO $$
DECLARE
    old_table_exists boolean;
    free_table_exists boolean;
    new_creator_id uuid;
BEGIN
    -- Check if old tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'meetups'
    ) INTO old_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'free_meetups'
    ) INTO free_table_exists;
    
    -- If neither old table exists, we're done
    IF NOT old_table_exists AND NOT free_table_exists THEN
        RAISE NOTICE 'No old tables found to migrate';
        RETURN;
    END IF;
    
    -- Create a system profile if we need to assign a creator
    SELECT id FROM public.profiles LIMIT 1 INTO new_creator_id;
    
    IF new_creator_id IS NULL THEN
        -- Create a system user in auth.users if needed
        DECLARE
            system_user_id uuid;
        BEGIN
            SELECT id FROM auth.users WHERE email = 'system@meetnow.app' INTO system_user_id;
            
            IF system_user_id IS NULL THEN
                INSERT INTO auth.users (id, email, created_at, updated_at)
                VALUES (
                    uuid_generate_v4(), 
                    'system@meetnow.app',
                    now(),
                    now()
                )
                RETURNING id INTO system_user_id;
            END IF;
            
            -- Create a system profile
            INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
            VALUES (
                system_user_id,
                'system',
                'System Account',
                now(),
                now()
            );
            
            new_creator_id := system_user_id;
        END;
    END IF;
    
    -- Migrate data from free_meetups if it exists
    IF free_table_exists THEN
        -- First get column info to deal with potential schema differences
        DECLARE
            has_location boolean;
            has_user_id boolean;
            has_title boolean;
            has_description boolean;
        BEGIN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'free_meetups'
                AND column_name = 'location'
            ) INTO has_location;
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'free_meetups'
                AND column_name = 'user_id'
            ) INTO has_user_id;
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'free_meetups'
                AND column_name = 'title'
            ) INTO has_title;
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'free_meetups'
                AND column_name = 'description'
            ) INTO has_description;
            
            -- Now migrate based on available columns
            IF has_location THEN
                INSERT INTO public.meetups (
                    id,
                    creator_id,
                    title,
                    description,
                    location,
                    address,
                    status,
                    max_participants,
                    current_participants,
                    created_at,
                    expires_at,
                    updated_at
                )
                SELECT 
                    fm.id,
                    CASE 
                        WHEN has_user_id AND fm.user_id IS NOT NULL THEN fm.user_id
                        ELSE new_creator_id
                    END as creator_id,
                    CASE 
                        WHEN has_title AND fm.title IS NOT NULL THEN fm.title
                        ELSE 'Meetup at ' || COALESCE(fm.address, 'Unknown Location')
                    END as title,
                    CASE 
                        WHEN has_description AND fm.description IS NOT NULL THEN fm.description
                        ELSE NULL
                    END as description,
                    ST_SetSRID(ST_MakePoint(
                        (fm.location->>'lng')::float, 
                        (fm.location->>'lat')::float
                    ), 4326)::geography as location,
                    fm.address,
                    CASE 
                        WHEN fm.status = 'active' AND fm.expires_at > now() THEN 'active'::meetup_status
                        WHEN fm.status = 'cancelled' THEN 'cancelled'::meetup_status
                        ELSE 'expired'::meetup_status
                    END as status,
                    COALESCE(fm.max_participants, 50) as max_participants,
                    COALESCE(fm.current_participants, 1) as current_participants,
                    fm.created_at,
                    fm.expires_at,
                    COALESCE(fm.last_activity_at, fm.created_at) as updated_at
                FROM 
                    public.free_meetups fm
                ON CONFLICT (id) DO NOTHING;
                
                RAISE NOTICE 'Migrated data from free_meetups';
            ELSE
                RAISE NOTICE 'free_meetups table exists but has incompatible schema';
            END IF;
        END;
    END IF;
    
    -- Migrate from old meetups table if needed and if not the new schema
    IF old_table_exists THEN
        -- Check if this is the old schema by looking for user_profile column
        DECLARE
            has_user_profile boolean;
            has_location boolean;
        BEGIN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'meetups'
                AND column_name = 'user_profile'
            ) INTO has_user_profile;
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'meetups'
                AND column_name = 'location'
            ) INTO has_location;
            
            -- Only migrate if this is the old schema
            IF has_user_profile AND has_location THEN
                -- Create a backup of the old table
                CREATE TABLE IF NOT EXISTS public.meetups_old_backup AS
                SELECT * FROM public.meetups;
                
                -- Rename the current table
                ALTER TABLE public.meetups RENAME TO meetups_old;
                
                -- Create the new meetups table (already done in repair script)
                -- Now migrate the data from the old table
                INSERT INTO public.meetups (
                    creator_id,
                    title,
                    description,
                    location,
                    address,
                    status,
                    max_participants,
                    current_participants,
                    created_at,
                    expires_at,
                    updated_at
                )
                SELECT 
                    COALESCE(m.user_id, new_creator_id) as creator_id,
                    COALESCE(m.place_name, 'Meetup at ' || COALESCE(m.address, 'Unknown Location')) as title,
                    m.description,
                    ST_SetSRID(ST_MakePoint(
                        (m.location->>'lng')::float, 
                        (m.location->>'lat')::float
                    ), 4326)::geography as location,
                    m.address,
                    CASE 
                        WHEN m.status = 'active' AND m.end_time > now() THEN 'active'::meetup_status
                        WHEN m.status = 'cancelled' THEN 'cancelled'::meetup_status
                        ELSE 'expired'::meetup_status
                    END as status,
                    50 as max_participants, -- Default
                    1 as current_participants, -- Default
                    m.created_at,
                    m.end_time as expires_at,
                    COALESCE(m.updated_at, m.created_at) as updated_at
                FROM 
                    public.meetups_old m
                ON CONFLICT (id) DO NOTHING;
                
                RAISE NOTICE 'Migrated data from old meetups table';
            END IF;
        END;
    END IF;
    
END$$; 