-- PART 2: USER TRIGGER AND POLICIES
-- This migration sets up the user trigger and policies

-- Create the trigger function to create a profile when a user signs up
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

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create policies for the profiles table
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Check for "Profiles are viewable by everyone" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            CREATE POLICY "Profiles are viewable by everyone" 
                ON public.profiles FOR SELECT 
                USING (true);
            RAISE NOTICE 'Created policy "Profiles are viewable by everyone"';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Profiles are viewable by everyone" already exists';
        END;
    END IF;
    
    -- Check for "Users can update their own profile" policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        BEGIN
            CREATE POLICY "Users can update their own profile" 
                ON public.profiles FOR UPDATE 
                USING (id = auth.uid());
            RAISE NOTICE 'Created policy "Users can update their own profile"';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can update their own profile" already exists';
        END;
    END IF;
END
$$;

-- Enable RLS on meetups table (if it exists)
ALTER TABLE IF EXISTS public.meetups ENABLE ROW LEVEL SECURITY;

-- Create policies for the meetups table
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Only continue if the meetups table exists
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'meetups'
    ) THEN
        -- Check for "Public meetups are viewable by everyone" policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'meetups' AND policyname = 'Public meetups are viewable by everyone'
        ) INTO policy_exists;
        
        IF NOT policy_exists THEN
            BEGIN
                CREATE POLICY "Public meetups are viewable by everyone" 
                    ON public.meetups FOR SELECT 
                    USING (status = 'active');
                RAISE NOTICE 'Created policy "Public meetups are viewable by everyone"';
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Public meetups are viewable by everyone" already exists';
            END;
        END IF;
        
        -- Check for "Users can create meetups" policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'meetups' AND policyname = 'Users can create meetups'
        ) INTO policy_exists;
        
        IF NOT policy_exists THEN
            BEGIN
                CREATE POLICY "Users can create meetups" 
                    ON public.meetups FOR INSERT 
                    WITH CHECK (auth.uid() IS NOT NULL);
                RAISE NOTICE 'Created policy "Users can create meetups"';
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Users can create meetups" already exists';
            END;
        END IF;
        
        -- Check for "Users can update their own meetups" policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'meetups' AND policyname = 'Users can update their own meetups'
        ) INTO policy_exists;
        
        IF NOT policy_exists THEN
            BEGIN
                CREATE POLICY "Users can update their own meetups" 
                    ON public.meetups FOR UPDATE 
                    USING (user_id = auth.uid());
                RAISE NOTICE 'Created policy "Users can update their own meetups"';
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Users can update their own meetups" already exists';
            END;
        END IF;
        
        -- Check for "Users can delete their own meetups" policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'meetups' AND policyname = 'Users can delete their own meetups'
        ) INTO policy_exists;
        
        IF NOT policy_exists THEN
            BEGIN
                CREATE POLICY "Users can delete their own meetups" 
                    ON public.meetups FOR DELETE 
                    USING (user_id = auth.uid());
                RAISE NOTICE 'Created policy "Users can delete their own meetups"';
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Users can delete their own meetups" already exists';
            END;
        END IF;
    ELSE
        RAISE NOTICE 'Meetups table does not exist - skipping meetups policies';
    END IF;
END
$$; 