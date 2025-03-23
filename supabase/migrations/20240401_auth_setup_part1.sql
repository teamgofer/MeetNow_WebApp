-- PART 1: PROFILES TABLE SETUP
-- This migration focuses on setting up the profiles table and RLS

-- Enable RLS on profiles table
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure profiles table exists with all needed columns
DO $$
BEGIN
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            username text UNIQUE,
            display_name text,
            avatar_url text,
            bio text,
            is_admin boolean DEFAULT false,
            credits integer DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Created profiles table';
    ELSE
        -- Table exists, check for missing columns
        
        -- Check for display_name column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN display_name text;
            RAISE NOTICE 'Added display_name column to profiles table';
        END IF;
        
        -- Check for bio column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN bio text;
            RAISE NOTICE 'Added bio column to profiles table';
        END IF;
        
        -- Check for is_admin column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
            RAISE NOTICE 'Added is_admin column to profiles table';
        END IF;
        
        -- Check for credits column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN credits integer DEFAULT 0;
            RAISE NOTICE 'Added credits column to profiles table';
        END IF;
        
        -- Check for updated_at column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
            RAISE NOTICE 'Added updated_at column to profiles table';
        END IF;
    END IF;
END
$$; 