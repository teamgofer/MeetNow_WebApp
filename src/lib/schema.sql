-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  store_credit DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User locations table
CREATE TABLE IF NOT EXISTS user_locations (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_locations_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meetups table
CREATE TABLE IF NOT EXISTS meetups (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  creator_id INTEGER REFERENCES users(id),
  image_url TEXT,
  restriction VARCHAR(50) DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT meetups_creator_fk FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create spatial indexes
CREATE INDEX IF NOT EXISTS user_locations_idx ON user_locations USING GIST (location);
CREATE INDEX IF NOT EXISTS meetups_location_idx ON meetups USING GIST (location);

-- Create index for expired meetups cleanup
CREATE INDEX IF NOT EXISTS meetups_expires_at_idx ON meetups(expires_at);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_updated on user_locations
CREATE TRIGGER update_user_locations_timestamp
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated(); 