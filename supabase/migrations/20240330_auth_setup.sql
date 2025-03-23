-- AUTH AND PERMISSIONS SETUP
-- Comprehensive setup for authentication, roles, and permissions

-- 1. PROFILES TABLE SETUP
-- Check if profiles table exists and create it if not
DO $$
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        -- Create the profiles table
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
    ELSE
        -- Table exists, check if display_name column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
        ) THEN
            -- Add display_name column
            ALTER TABLE public.profiles ADD COLUMN display_name text;
        END IF;
        
        -- Check if bio column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio'
        ) THEN
            -- Add bio column
            ALTER TABLE public.profiles ADD COLUMN bio text;
        END IF;
        
        -- Check if is_admin column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
        ) THEN
            -- Add is_admin column
            ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
        END IF;
        
        -- Check if credits column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits'
        ) THEN
            -- Add credits column
            ALTER TABLE public.profiles ADD COLUMN credits integer DEFAULT 0;
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
        ) THEN
            -- Add updated_at column
            ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
        END IF;
    END IF;
END
$$;

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        new.id, 
        COALESCE(new.email, new.phone, 'user_' || new.id), 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER CREDITS SYSTEM
-- Create a function to add credits to a user's account
CREATE OR REPLACE FUNCTION public.add_user_credits(
    p_user_id uuid,
    p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        credits = credits + p_amount,
        updated_at = now()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Create a function to use credits for a meetup
CREATE OR REPLACE FUNCTION public.use_credits_for_meetup(
    p_user_id uuid,
    p_credits_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_credits integer;
BEGIN
    -- Get current user credits
    SELECT credits INTO v_user_credits
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Check if user has enough credits
    IF v_user_credits < p_credits_amount THEN
        RAISE EXCEPTION 'Insufficient credits: % available, % required', v_user_credits, p_credits_amount;
    END IF;
    
    -- Deduct credits
    UPDATE public.profiles
    SET 
        credits = credits - p_credits_amount,
        updated_at = now()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$;

-- 3. PERMISSIONS AND POLICIES
-- Set up Row Level Security for all tables

-- Profiles table permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies for profiles table
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
    ) THEN
        DROP POLICY "Profiles are viewable by everyone" ON public.profiles;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        DROP POLICY "Users can update their own profile" ON public.profiles;
    END IF;
    
    -- Drop policies for meetups table
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Public meetups are viewable by everyone'
    ) THEN
        DROP POLICY "Public meetups are viewable by everyone" ON public.meetups;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Users can create meetups'
    ) THEN
        DROP POLICY "Users can create meetups" ON public.meetups;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Users can update their own meetups'
    ) THEN
        DROP POLICY "Users can update their own meetups" ON public.meetups;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meetups' AND policyname = 'Users can delete their own meetups'
    ) THEN
        DROP POLICY "Users can delete their own meetups" ON public.meetups;
    END IF;
END
$$;

-- Users can read any profile
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (id = auth.uid());

-- Meetups table permissions (assuming meetups table exists)
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Anyone can view active meetups
CREATE POLICY "Public meetups are viewable by everyone" 
    ON public.meetups FOR SELECT 
    USING (status = 'active');

-- Users can create meetups
CREATE POLICY "Users can create meetups" 
    ON public.meetups FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own meetups
CREATE POLICY "Users can update their own meetups" 
    ON public.meetups FOR UPDATE 
    USING (user_id = auth.uid());

-- Users can delete their own meetups
CREATE POLICY "Users can delete their own meetups" 
    ON public.meetups FOR DELETE 
    USING (user_id = auth.uid());

-- 4. ENHANCED MEETUP CREATION FUNCTIONS
-- Update the meetup creation functions to handle authentication and credits

-- Function to create a paid meetup with extended duration using credits
CREATE OR REPLACE FUNCTION public.create_paid_meetup(
    p_title text,
    p_description text,
    p_address text,
    p_image text,
    p_lat float8,
    p_lng float8,
    p_duration_minutes integer,
    p_max_participants integer DEFAULT 20,
    p_credits_to_use integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_meetup_id uuid;
    v_created_at timestamptz;
    v_starts_at timestamptz;
    v_user_id uuid;
    v_result json;
BEGIN
    -- Ensure user is authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for paid meetups';
    END IF;

    -- Use credits if specified
    IF p_credits_to_use > 0 THEN
        PERFORM public.use_credits_for_meetup(v_user_id, p_credits_to_use);
    END IF;

    -- Insert the meetup
    INSERT INTO public.meetups (
        user_id,
        title,
        description,
        location,
        address,
        image_url,
        duration_minutes,
        max_participants,
        is_free_meetup,
        status
    ) VALUES (
        v_user_id,
        p_title,
        p_description,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_address,
        p_image,
        p_duration_minutes,
        p_max_participants,
        false,
        'active'
    )
    RETURNING id, created_at, starts_at INTO v_meetup_id, v_created_at, v_starts_at;

    -- Build the result JSON
    SELECT json_build_object(
        'id', v_meetup_id,
        'title', p_title,
        'created_at', v_created_at,
        'starts_at', v_starts_at,
        'duration_minutes', p_duration_minutes,
        'expires_at', v_starts_at + (p_duration_minutes || ' minutes')::interval,
        'credits_used', p_credits_to_use
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Update the free meetup function to check for authentication
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_title text,
    p_description text,
    p_address text,
    p_lat float8,
    p_lng float8
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_result json;
BEGIN
    -- Get current user ID (can be NULL for anonymous users)
    v_user_id := auth.uid();
    
    -- Call the create_meetup function with standard parameters
    INSERT INTO public.meetups (
        user_id,
        title,
        description,
        location,
        address,
        duration_minutes,
        is_free_meetup,
        status
    ) VALUES (
        v_user_id,  -- This can be NULL for anonymous users
        p_title,
        p_description,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_address,
        60, -- Default to 1 hour for free meetups
        true,
        'active'
    )
    RETURNING json_build_object(
        'id', id,
        'title', title,
        'created_at', created_at,
        'starts_at', starts_at,
        'duration_minutes', duration_minutes,
        'expires_at', starts_at + (duration_minutes || ' minutes')::interval,
        'is_anonymous', v_user_id IS NULL
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 5. ADMIN FUNCTIONS
-- Create functions for administrator operations

-- Function to grant admin privileges
CREATE OR REPLACE FUNCTION public.grant_admin_privileges(
    p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_is_admin boolean;
BEGIN
    -- Check if current user is an admin
    v_user_id := auth.uid();
    
    SELECT is_admin INTO v_is_admin 
    FROM public.profiles 
    WHERE id = v_user_id;
    
    IF v_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Only administrators can grant admin privileges';
    END IF;
    
    -- Grant admin privileges to target user
    UPDATE public.profiles
    SET 
        is_admin = true,
        updated_at = now()
    WHERE id = p_target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function for admins to manage any meetup
CREATE OR REPLACE FUNCTION public.admin_update_meetup(
    p_meetup_id uuid,
    p_status text DEFAULT NULL,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_max_participants integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_is_admin boolean;
    v_result json;
    v_updates record;
BEGIN
    -- Check if current user is an admin
    v_user_id := auth.uid();
    
    SELECT is_admin INTO v_is_admin 
    FROM public.profiles 
    WHERE id = v_user_id;
    
    IF v_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Only administrators can perform this action';
    END IF;
    
    -- Build dynamic update
    UPDATE public.meetups
    SET
        status = COALESCE(p_status, status),
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        max_participants = COALESCE(p_max_participants, max_participants),
        updated_at = now()
    WHERE id = p_meetup_id
    RETURNING * INTO v_updates;
    
    -- Convert the result to JSON
    SELECT json_build_object(
        'id', v_updates.id,
        'title', v_updates.title,
        'status', v_updates.status,
        'description', v_updates.description,
        'max_participants', v_updates.max_participants,
        'updated_at', v_updates.updated_at
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 6. GRANT APPROPRIATE PERMISSIONS
-- Grant permissions to the functions based on roles

-- Grant permissions for profiles table
GRANT SELECT ON public.profiles TO authenticated, anon;
GRANT UPDATE (username, display_name, avatar_url, bio) ON public.profiles TO authenticated;

-- Grant permissions for meetups functions
GRANT EXECUTE ON FUNCTION public.create_free_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_paid_meetup TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_meetups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_free_meetups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_meetup_expired TO anon, authenticated;

-- Grant permissions for credits functions
GRANT EXECUTE ON FUNCTION public.add_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_credits_for_meetup TO authenticated;

-- Grant permissions for admin functions to authenticated users
-- (the functions themselves check if the user is an admin)
GRANT EXECUTE ON FUNCTION public.grant_admin_privileges TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_meetup TO authenticated;

-- 7. TIME ZONE SUPPORT
-- Create a function to get current time in a specific time zone
CREATE OR REPLACE FUNCTION public.get_time_in_zone(
    p_timezone text DEFAULT 'UTC'
)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT now() AT TIME ZONE p_timezone;
$$;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION public.get_time_in_zone TO anon, authenticated; 