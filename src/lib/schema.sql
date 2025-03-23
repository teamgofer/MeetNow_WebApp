-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_registered BOOLEAN DEFAULT false,
    token_balance INTEGER DEFAULT 0
);

-- Store tokens table
CREATE TABLE IF NOT EXISTS store_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_hours INTEGER,
    price DECIMAL(10,2) NOT NULL,
    is_permanent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Token purchases table
CREATE TABLE IF NOT EXISTS token_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_id UUID REFERENCES store_tokens(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meetups table
CREATE TABLE IF NOT EXISTS meetups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    place_name VARCHAR(255),
    image_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_free_meetup BOOLEAN DEFAULT false,
    is_permanent BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    token_id UUID REFERENCES store_tokens(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Meetup categories table
CREATE TABLE IF NOT EXISTS meetup_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Meetup-category relationship
CREATE TABLE IF NOT EXISTS meetup_category_relations (
    meetup_id UUID REFERENCES meetups(id) ON DELETE CASCADE,
    category_id UUID REFERENCES meetup_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (meetup_id, category_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_search_radius INTEGER DEFAULT 5000, -- in meters
    preferred_categories UUID[] DEFAULT ARRAY[]::UUID[],
    notification_settings JSONB DEFAULT '{}'::jsonb,
    last_known_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP WITH TIME ZONE
);

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS meetups_location_idx ON meetups USING GIST (location);
CREATE INDEX IF NOT EXISTS meetups_expires_at_idx ON meetups(expires_at);
CREATE INDEX IF NOT EXISTS meetups_status_idx ON meetups(status);
CREATE INDEX IF NOT EXISTS meetups_created_at_idx ON meetups(created_at);
CREATE INDEX IF NOT EXISTS user_preferences_location_idx ON user_preferences USING GIST (last_known_location);

-- Function to automatically expire meetups
CREATE OR REPLACE FUNCTION auto_expire_meetups() RETURNS trigger AS $$
BEGIN
    UPDATE meetups
    SET status = 'expired'
    WHERE expires_at <= CURRENT_TIMESTAMP
    AND status = 'active';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for expired meetups
CREATE OR REPLACE TRIGGER check_expired_meetups
    AFTER INSERT OR UPDATE ON meetups
    EXECUTE FUNCTION auto_expire_meetups();

-- Function to calculate distance between points
CREATE OR REPLACE FUNCTION calculate_distance(
    point1 GEOGRAPHY,
    point2 GEOGRAPHY
) RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(point1, point2);
END;
$$ LANGUAGE plpgsql;

-- Function to find meetups within radius
CREATE OR REPLACE FUNCTION find_meetups_in_radius(
    center GEOGRAPHY,
    radius_meters INTEGER
) RETURNS TABLE (
    id UUID,
    title VARCHAR,
    distance FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        ST_Distance(m.location, center) as distance
    FROM meetups m
    WHERE ST_DWithin(m.location, center, radius_meters)
    AND m.status = 'active'
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- Everyone can view active meetups
CREATE POLICY meetups_view_policy ON meetups
    FOR SELECT
    USING (status = 'active');

-- Only creators can update their own meetups
CREATE POLICY meetups_update_policy ON meetups
    FOR UPDATE
    USING (created_by = auth.uid());

-- Anyone can create a meetup
CREATE POLICY meetups_insert_policy ON meetups
    FOR INSERT
    WITH CHECK (true);

-- Function to validate GeoJSON point
CREATE OR REPLACE FUNCTION is_valid_geojson_point(data JSONB) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        data->>'type' = 'Point' AND
        jsonb_array_length(data->'coordinates') = 2 AND
        (data->'coordinates'->0)::float BETWEEN -180 AND 180 AND
        (data->'coordinates'->1)::float BETWEEN -90 AND 90
    );
END;
$$ LANGUAGE plpgsql;

-- Function to handle scheduled meetup creation
CREATE OR REPLACE FUNCTION create_meetup(
    p_creator_id uuid,
    p_title text,
    p_location text, -- GeoJSON string
    p_description text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_image_url text DEFAULT NULL,
    p_max_participants int DEFAULT 10,
    p_starts_at timestamptz DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 day',
    p_expires_at timestamptz DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 days'
) RETURNS UUID AS $$
DECLARE
    v_meetup_id UUID;
    v_point GEOGRAPHY;
BEGIN
    -- Parse the GeoJSON string to PostGIS geography
    v_point := ST_SetSRID(
        ST_GeomFromGeoJSON(p_location),
        4326
    )::geography;

    -- Validate times
    IF p_starts_at <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Start time must be in the future';
    END IF;

    IF p_expires_at <= p_starts_at THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;

    INSERT INTO meetups (
        creator_id,
        title,
        description,
        location,
        address,
        image_url,
        max_participants,
        starts_at,
        expires_at,
        status,
        is_free_meetup
    ) VALUES (
        p_creator_id,
        p_title,
        p_description,
        v_point,
        p_address,
        p_image_url,
        p_max_participants,
        p_starts_at,
        p_expires_at,
        'active',
        false
    ) RETURNING id INTO v_meetup_id;
    
    RETURN v_meetup_id;
EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error creating meetup: %, Detail: %, Hint: %, Location: %', 
        SQLERRM, 
        SQLSTATE, 
        p_location,
        v_point;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to handle free instant meetup creation
CREATE OR REPLACE FUNCTION create_instant_meetup(
    p_title VARCHAR DEFAULT 'Free Meetup',
    p_description TEXT DEFAULT NULL,
    p_location TEXT DEFAULT '{"type":"Point","coordinates":[0,0]}',
    p_address TEXT DEFAULT 'Unknown Location',
    p_image_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_meetup_id UUID;
    v_point GEOGRAPHY;
BEGIN
    -- Parse the GeoJSON string to PostGIS geography
    v_point := ST_SetSRID(
        ST_GeomFromGeoJSON(p_location),
        4326
    )::geography;

    INSERT INTO meetups (
        title,
        description,
        location,
        address,
        image_url,
        is_free_meetup,
        starts_at,
        expires_at,
        status
    ) VALUES (
        p_title,
        p_description,
        v_point,
        p_address,
        p_image_url,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 hour',
        'active'
    ) RETURNING id INTO v_meetup_id;
    
    RETURN v_meetup_id;
EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error creating instant meetup: %, Detail: %, Hint: %, Location: %', 
        SQLERRM, 
        SQLSTATE, 
        p_location,
        v_point;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_instant_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_free_meetup TO anon, authenticated; 