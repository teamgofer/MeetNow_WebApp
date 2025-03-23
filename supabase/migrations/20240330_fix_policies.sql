-- FIX EXISTING POLICIES
-- This migration safely updates existing policies without recreating them

-- 1. Update existing policies if they exist, otherwise do nothing
DO $$
BEGIN
    -- For meetups table policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Public meetups are viewable by everyone'
    ) THEN
        -- Drop and recreate with the correct definition
        DROP POLICY "Public meetups are viewable by everyone" ON public.meetups;
        
        -- Recreate with the same definition (or updated if needed)
        CREATE POLICY "Public meetups are viewable by everyone" 
            ON public.meetups FOR SELECT 
            USING (status = 'active');
        
        RAISE NOTICE 'Updated policy "Public meetups are viewable by everyone" on meetups table';
    END IF;

    -- For profiles table policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
    ) THEN
        -- Drop and recreate with the correct definition
        DROP POLICY "Profiles are viewable by everyone" ON public.profiles;
        
        -- Recreate with the same definition (or updated if needed)
        CREATE POLICY "Profiles are viewable by everyone" 
            ON public.profiles FOR SELECT 
            USING (true);
        
        RAISE NOTICE 'Updated policy "Profiles are viewable by everyone" on profiles table';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        -- Drop and recreate with the correct definition
        DROP POLICY "Users can update their own profile" ON public.profiles;
        
        -- Recreate with the same definition (or updated if needed)
        CREATE POLICY "Users can update their own profile" 
            ON public.profiles FOR UPDATE 
            USING (id = auth.uid());
        
        RAISE NOTICE 'Updated policy "Users can update their own profile" on profiles table';
    END IF;
END
$$;

-- 2. Ensure RLS is enabled on tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetups ENABLE ROW LEVEL SECURITY;

-- 3. Check and update columns in the profiles table
DO $$
BEGIN
    -- Check and add missing columns in profiles table
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        -- Check if display_name column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
        ) THEN
            -- Add display_name column
            ALTER TABLE public.profiles ADD COLUMN display_name text;
            RAISE NOTICE 'Added display_name column to profiles table';
        END IF;
        
        -- Check if bio column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio'
        ) THEN
            -- Add bio column
            ALTER TABLE public.profiles ADD COLUMN bio text;
            RAISE NOTICE 'Added bio column to profiles table';
        END IF;
        
        -- Check if is_admin column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
        ) THEN
            -- Add is_admin column
            ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
            RAISE NOTICE 'Added is_admin column to profiles table';
        END IF;
        
        -- Check if credits column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits'
        ) THEN
            -- Add credits column
            ALTER TABLE public.profiles ADD COLUMN credits integer DEFAULT 0;
            RAISE NOTICE 'Added credits column to profiles table';
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
        ) THEN
            -- Add updated_at column
            ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
            RAISE NOTICE 'Added updated_at column to profiles table';
        END IF;
    END IF;
END
$$; 