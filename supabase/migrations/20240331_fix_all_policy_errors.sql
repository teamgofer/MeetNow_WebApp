-- Fix ALL policy errors with extra caution
-- This migration uses an alternative approach to avoid policy errors

-- Enable RLS on tables if not already enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetups ENABLE ROW LEVEL SECURITY;

-- Alternative approach: Use dynamic SQL to create policies only if they don't exist
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- PROFILES TABLE POLICIES --
    
    -- Check "Profiles are viewable by everyone" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            EXECUTE 'CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true)';
            RAISE NOTICE 'Created policy "Profiles are viewable by everyone" on profiles table';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Profiles are viewable by everyone" already exists';
        END;
    ELSE
        RAISE NOTICE 'Policy "Profiles are viewable by everyone" already exists';
    END IF;
    
    -- Check "Users can update their own profile" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid())';
            RAISE NOTICE 'Created policy "Users can update their own profile" on profiles table';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can update their own profile" already exists';
        END;
    ELSE
        RAISE NOTICE 'Policy "Users can update their own profile" already exists';
    END IF;
    
    -- MEETUPS TABLE POLICIES --
    
    -- Check "Public meetups are viewable by everyone" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Public meetups are viewable by everyone'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            EXECUTE 'CREATE POLICY "Public meetups are viewable by everyone" ON public.meetups FOR SELECT USING (status = ''active'')';
            RAISE NOTICE 'Created policy "Public meetups are viewable by everyone" on meetups table';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Public meetups are viewable by everyone" already exists';
        END;
    ELSE
        RAISE NOTICE 'Policy "Public meetups are viewable by everyone" already exists';
    END IF;
    
    -- Check "Users can create meetups" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Users can create meetups'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            EXECUTE 'CREATE POLICY "Users can create meetups" ON public.meetups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
            RAISE NOTICE 'Created policy "Users can create meetups" on meetups table';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can create meetups" already exists';
        END;
    ELSE
        RAISE NOTICE 'Policy "Users can create meetups" already exists';
    END IF;
    
    -- Check "Users can update their own meetups" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Users can update their own meetups'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            EXECUTE 'CREATE POLICY "Users can update their own meetups" ON public.meetups FOR UPDATE USING (user_id = auth.uid())';
            RAISE NOTICE 'Created policy "Users can update their own meetups" on meetups table';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can update their own meetups" already exists';
        END;
    ELSE
        RAISE NOTICE 'Policy "Users can update their own meetups" already exists';
    END IF;
    
    -- Check "Users can delete their own meetups" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Users can delete their own meetups'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            EXECUTE 'CREATE POLICY "Users can delete their own meetups" ON public.meetups FOR DELETE USING (user_id = auth.uid())';
            RAISE NOTICE 'Created policy "Users can delete their own meetups" on meetups table';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can delete their own meetups" already exists';
        END;
    ELSE
        RAISE NOTICE 'Policy "Users can delete their own meetups" already exists';
    END IF;
END
$$;

-- Ensure all necessary columns exist in the profiles table
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
            BEGIN
                -- Add display_name column
                ALTER TABLE public.profiles ADD COLUMN display_name text;
                RAISE NOTICE 'Added display_name column to profiles table';
            EXCEPTION WHEN duplicate_column THEN
                RAISE NOTICE 'Column display_name already exists in profiles table';
            END;
        END IF;
        
        -- Check if bio column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio'
        ) THEN
            BEGIN
                -- Add bio column
                ALTER TABLE public.profiles ADD COLUMN bio text;
                RAISE NOTICE 'Added bio column to profiles table';
            EXCEPTION WHEN duplicate_column THEN
                RAISE NOTICE 'Column bio already exists in profiles table';
            END;
        END IF;
        
        -- Check if is_admin column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
        ) THEN
            BEGIN
                -- Add is_admin column
                ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
                RAISE NOTICE 'Added is_admin column to profiles table';
            EXCEPTION WHEN duplicate_column THEN
                RAISE NOTICE 'Column is_admin already exists in profiles table';
            END;
        END IF;
        
        -- Check if credits column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits'
        ) THEN
            BEGIN
                -- Add credits column
                ALTER TABLE public.profiles ADD COLUMN credits integer DEFAULT 0;
                RAISE NOTICE 'Added credits column to profiles table';
            EXCEPTION WHEN duplicate_column THEN
                RAISE NOTICE 'Column credits already exists in profiles table';
            END;
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
        ) THEN
            BEGIN
                -- Add updated_at column
                ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
                RAISE NOTICE 'Added updated_at column to profiles table';
            EXCEPTION WHEN duplicate_column THEN
                RAISE NOTICE 'Column updated_at already exists in profiles table';
            END;
        END IF;
    END IF;
END
$$; 