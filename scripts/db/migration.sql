-- Drop all existing triggers and constraints first
DROP TRIGGER IF EXISTS validate_expiration_time ON free_meetups;
DROP FUNCTION IF EXISTS validate_expiration_time();
DROP FUNCTION IF EXISTS create_free_meetup();

-- Function to get server time
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT now();
$$;

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS free_meetups CASCADE;
CREATE TABLE free_meetups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location jsonb NOT NULL,
  address text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CONSTRAINT expires_at_future CHECK (expires_at > now())
);

-- Create function to create a free meetup with proper timestamp handling
CREATE OR REPLACE FUNCTION create_free_meetup(
  p_location jsonb,
  p_address text,
  p_status text DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_server_time timestamptz;
  v_expiration_time timestamptz;
  v_result jsonb;
BEGIN
  -- Get current server time
  SELECT now() INTO v_server_time;
  
  -- Set expiration time to 1 hour from now
  SELECT v_server_time + interval '1 hour' INTO v_expiration_time;

  -- Log the times for debugging
  RAISE NOTICE 'Creating meetup with times:';
  RAISE NOTICE '  Server time: %', v_server_time;
  RAISE NOTICE '  Expiration time: %', v_expiration_time;

  -- Insert the meetup and return the result
  WITH inserted_meetup AS (
    INSERT INTO free_meetups (
      location,
      address,
      status,
      created_at,
      expires_at
    )
    VALUES (
      p_location,
      p_address,
      COALESCE(p_status, 'active'),
      v_server_time,
      v_expiration_time
    )
    RETURNING *
  )
  SELECT row_to_json(inserted_meetup)::jsonb
  INTO v_result
  FROM inserted_meetup;

  -- Log the final result for debugging
  RAISE NOTICE 'Meetup created with data: %', v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN check_violation THEN
    RAISE EXCEPTION 'Failed to create meetup: Server time: %, Expiration time: %', v_server_time, v_expiration_time;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Unexpected error creating meetup: %', SQLERRM;
END;
$$;

-- Enable RLS if not already enabled
ALTER TABLE free_meetups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since these are public meetups)
DROP POLICY IF EXISTS "Allow all operations for free_meetups" ON free_meetups;
CREATE POLICY "Allow all operations for free_meetups"
  ON free_meetups
  FOR ALL
  USING (true)
  WITH CHECK (true); 