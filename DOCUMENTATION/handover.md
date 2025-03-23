# MeetNow Project Handover Documentation

## Project Overview

MeetNow is a real-time local meetup platform that enables instant, location-based connections. The application allows users to:
- Create meetups at specific locations
- Discover nearby meetups
- Manage user profiles and credits
- Search for locations

### Tech Stack
- Frontend: React with Vite
- UI: TailwindCSS
- Maps: Leaflet
- Backend: Supabase (PostgreSQL)
- Authentication: Supabase Auth

### Current Development Stage
The application appears to be in active development with core features implemented:
- Map-based interface with location detection
- Meetup creation functionality
- Nearby meetup discovery
- User authentication and profile management
- Credits system

## Database Schema

The database uses PostgreSQL with PostGIS extension for geographical data. Below is the current schema structure:

### Core Tables

#### meetups
Main table storing meetup information:
```sql
CREATE TABLE public.meetups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  title text NOT NULL DEFAULT 'Meetup'::text,
  description text NULL,
  location geography NULL,
  address text NOT NULL DEFAULT 'Unknown location'::text,
  image_url text NULL,
  max_participants integer NOT NULL DEFAULT 10,
  current_participants integer NOT NULL DEFAULT 1,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'active'::text,
  is_free_meetup boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
)
```

Optimized with indexes:
- `meetups_location_idx` - GiST index on location for spatial queries
- `meetups_user_id_idx` - B-tree index on user_id
- `meetups_status_idx` - B-tree index on status
- `meetups_is_free_meetup_idx` - B-tree index on is_free_meetup
- `meetups_starts_at_idx` - B-tree index on starts_at

#### profiles
User profile information:
```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NULL,
  avatar_url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  display_name text NULL,
  bio text NULL,
  is_admin boolean NULL DEFAULT false,
  credits integer NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
)
```

#### credits_history
Audit table for tracking credit balance changes:
```sql
CREATE TABLE public.credits_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
)
```

#### meetup_participants
Junction table for meetup attendance:
```sql
CREATE TABLE public.meetup_participants (
  meetup_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now()
)
```

#### meetup_history
Archive table for expired meetups:
```sql
CREATE TABLE public.meetup_history (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  title text NOT NULL,
  description text NULL,
  location geography NOT NULL,
  user_id uuid NULL,
  image_url text NULL,
  address text NOT NULL,
  archived_at timestamp with time zone NULL DEFAULT now()
)
```

#### itineraries
Stores detailed meetup schedules with time segments:
```sql
CREATE TABLE public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meetup_id uuid NULL,
  segment_order integer NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location geography NULL,
  description text NULL
)
```

### Database Views

#### meetups_with_expiry
Extends the meetups table with calculated expiration time:
```sql
CREATE VIEW public.meetups_with_expiry AS 
SELECT meetups.id,
       meetups.title,
       meetups.description,
       meetups.location,
       meetups.address,
       meetups.image_url,
       meetups.user_id,
       meetups.created_at,
       meetups.starts_at,
       meetups.duration_minutes,
       meetups.starts_at + ((meetups.duration_minutes || ' minutes'::text)::interval) AS expires_at,
       meetups.status,
       meetups.is_free_meetup,
       meetups.max_participants,
       meetups.current_participants
FROM meetups;
```

#### PostGIS Views
The schema includes standard PostGIS views:
- `geometry_columns` - PostGIS view for geometry columns
- `geography_columns` - PostGIS view for geography columns

### Key Relationships
- Meetups are created by users (profiles)
- Users participate in meetups through meetup_participants
- Meetups can have structured itineraries
- Credit balances are now tracked only in the profiles table with history in credits_history

### Data Types
- Location data now uses PostGIS `geography` type consistently for all location columns
- Time data uses timestamp with time zone for accurate global timing

### Schema Update Summary

The schema has been updated to address two key inconsistencies:

1. **Credits Tracking Consolidation**: ✅ COMPLETED 
   - The redundant `credits` table has been removed
   - All credit values are now stored only in `profiles.credits`
   - Added `credits_history` table for auditing credit changes
   - A trigger on `profiles.credits` automatically logs changes to the history table
   - All credit-related functions now reference `profiles.credits`

2. **Spatial Type Standardization**: ✅ COMPLETED
   - Converted `meetup_history.location` from `geometry` to `geography` type
   - All spatial data now uses the `geography` type consistently
   - Updated spatial indexes and related functions

These changes improve data consistency and simplify development by:
- Eliminating the risk of credit balance desynchronization
- Providing a consistent spatial data type across all tables
- Adding audit capability for credit changes

## Environment Configuration

The project uses multiple environment files:
- **.env**: Base environment variables
- **.env.development**: Development-specific variables
- **.env.local**: Local overrides (not committed to source control)

## Development Workflow

### Local Setup
1. Clone the repository
2. Install dependencies with `npm install`
3. Configure local environment variables in `.env.local`
4. Start the development server with `npm run dev`

### Supabase Setup
1. The application requires a Supabase project with:
   - PostgreSQL database with PostGIS extension
   - Authentication configured
   - pg_cron extension enabled
2. Apply migrations from the `supabase/migrations` directory in sequence
3. Apply functions from the `supabase/functions` directory

### Testing
1. Run test scripts from the project root using Node.js
2. Example: `node test-auth-setup.js` to verify authentication setup
3. Create test users with `node create-test-user.js`
4. The `manual_test_fixed.sql` script can be used to verify schema changes

## SQL File Analysis

After analyzing the SQL files in the project, I've identified the following structure:

### Main SQL Files in supabase/
- **search_functions.sql**: Contains location search functionality
- **create_free_meetup.sql**: Logic for creating free meetups
- **setup_roles.sql**: Database role configuration
- **compatibility_layer.sql**: Backward compatibility functions
- **compatibility_indexes.sql**: Index definitions for compatibility
- **migrate_data.sql**: Data migration scripts

### Migration Files in supabase/migrations/
The migration directory contains dated SQL files showing the progression of database schema changes.

### Archived SQL Files
The following files have been identified as redundant and moved to the supabase/archive directory:

1. One-time diagnostic and repair scripts:
   - diagnose_schema.sql
   - repair_schema.sql
   - manual_cleanup.sql
   - fix_permissions.sql

2. Redundant stack depth fix files (moved to supabase/archive/migrations):
   - 20240328_fix_stack_depth_v3.sql
   - 20240328_fix_stack_depth_final_v2.sql
   - 20240328_fix_stack_depth_final.sql
   - 20240326_fix_stack_depth_simple.sql
   - 20240326_fix_stack_depth_final.sql
   - 20240326_fix_stack_depth_v2.sql
   - 20240326_fix_stack_depth.sql

3. Early migration files that were superseded by "combined_updates.sql" or "clean_slate.sql"

This cleanup helps maintain a cleaner repository structure while preserving the history of database changes.

## Database Automation (pg_cron)

The project utilizes PostgreSQL's pg_cron extension to schedule automated database tasks. The implementation includes:

### Scheduled Jobs
- **Expired Meetups Cleanup**: Runs hourly to archive and clean up expired meetups
- **User Activity Stats Refresh**: Runs daily at 3 AM to update user activity statistics
- **Database Maintenance**: Performs VACUUM ANALYZE weekly on Sundays at 2 AM

### Implementation Details
These jobs are defined in the `20240318_setup_pg_cron.sql` migration file, which:
1. Enables the pg_cron extension
2. Creates necessary functions for background jobs
3. Creates a meetup_history table for archiving expired meetups
4. Schedules the periodic jobs

This automation improves application performance and data management without requiring manual intervention.

## Testing Scripts

The repository contains several test scripts in the root directory:
- **test-credits-functionality.js**: Tests the credit system functionality
- **test-auth-setup.js**: Verifies authentication configuration
- **create-test-user.js** and **create-new-test-user.js**: Create test users in the system
- **test-supabase*.js files**: Various tests for Supabase functionality
- **manual_test_fixed.sql**: SQL script to verify schema changes

These scripts should be run in a development environment to verify system functionality.

## Deployment

The project appears to be set up for deployment on Vercel (.vercel directory exists). Deployment
configuration and pipeline details should be documented separately.

### Task Log
- 2024-03-15: Initial project analysis and documentation setup
- 2024-03-15: Identified redundant SQL files for potential archiving
- 2024-03-18: Created archive structure and moved redundant SQL files
   - Created supabase/archive and supabase/archive/migrations directories
   - Moved one-time diagnostic and repair scripts to archive
   - Moved redundant stack depth fix migrations to archive/migrations
   - Moved early migration files superseded by combined updates to archive/migrations
- 2024-03-18: Implemented pg_cron for database automation
   - Created migration file to enable the extension
   - Defined functions for expired meetup cleanup and user stats refresh
   - Scheduled periodic maintenance tasks
- 2024-03-18: Enhanced documentation with database schema, environment config, testing and development workflow
- 2024-03-18: Updated schema documentation with complete current database structure
- 2024-03-18: Created migration file and plan for fixing schema inconsistencies
   - Consolidating credit tracking to profiles.credits
   - Standardizing on geography type for spatial data
- 2024-03-18: Successfully applied schema updates:
   - Removed redundant credits table
   - Added credits_history table with trigger for audit tracking
   - Converted meetup_history.location to geography type
   - Created test scripts to verify changes 