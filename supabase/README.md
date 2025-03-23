# MeetNow Database Schema Repair

This directory contains scripts to diagnose, repair, and migrate your Supabase database schema to the latest version.

## Overview

Our application has been updated to use a new database schema with PostGIS for spatial queries. This allows for more efficient nearby meetup searches and better data organization.

If you're encountering issues with the database schema being partially imported, follow these steps to diagnose and repair the issues.

## Files Included

- `diagnose_schema.sql`: Diagnostic script to check the current state of your database
- `repair_schema.sql`: Script to repair or create missing tables, functions, and other schema components
- `migrate_data.sql`: Script to migrate data from old schema to the new schema
- `create_meetup.sql`: SQL function for creating meetups with PostGIS point data

## Step-by-Step Instructions

### 1. Run the Diagnostic Script

First, run the diagnostic script to understand what's missing from your database:

1. Log into the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `diagnose_schema.sql`
4. Run the script and review the results

### 2. Repair the Schema

After identifying what's missing, run the repair script to fix the issues:

1. Go to the SQL Editor
2. Copy and paste the contents of `repair_schema.sql`
3. Run the script

The repair script is designed to safely execute without errors even if some components already exist. It will:

- Create missing extensions (PostGIS, UUID-OSSP, pg_cron)
- Create missing schemas (if needed)
- Create missing tables with proper constraints
- Create or update functions for spatial queries
- Set up triggers and policies
- Configure Row Level Security (RLS)

### 3. Migrate Your Data

If you had data in the old schema, run the migration script to transfer it to the new schema:

1. Go to the SQL Editor
2. Copy and paste the contents of `migrate_data.sql`
3. Run the script

This script will:
- Detect if old tables exist
- Create a system user if needed for data migration
- Migrate data from `free_meetups` table (if it exists)
- Migrate data from the old `meetups` table (if it exists and is the old schema)
- Convert JSON location data to PostGIS geography points

### 4. Install the Create Meetup Function

Finally, install the custom function for creating meetups:

1. Go to the SQL Editor
2. Copy and paste the contents of `create_meetup.sql`
3. Run the script

## Verifying the Fix

After running these scripts, you can verify everything is working by:

1. Creating a new meetup using the application
2. Searching for nearby meetups
3. Checking that all existing data has been migrated

## Troubleshooting

If you encounter errors:

- For permission errors: Make sure your Supabase service role has the necessary permissions
- For PostGIS errors: Ensure the PostGIS extension is installed
- For pg_cron errors: This extension requires superuser privileges and is not available in most Supabase plans

### Handling Missing pg_cron Extension

If you see an error like `relation "cron.job" does not exist`, it means the pg_cron extension is not available in your Supabase database. This is normal and expected for many Supabase plans.

The repair script will create a fallback function called `manual_cleanup_expired_meetups()` that you can use instead. You can run this function manually or set up an external scheduler (like GitHub Actions, AWS Lambda, or any other cron service) to call it regularly.

To manually clean up expired meetups:

```sql
SELECT public.manual_cleanup_expired_meetups();
```

This will return a message indicating how many expired meetups were updated.

If you need automatic cleanup, consider these alternatives:
1. Set up a serverless function that runs on a schedule and calls this cleanup function
2. Use the application code to filter out expired meetups (already implemented)
3. Upgrade to a Supabase plan that supports the pg_cron extension

## Schema Details

The new schema uses:

- PostGIS for spatial queries
- Enum types for meetup status
- Separate participant tracking table
- Database functions for nearby searches
- Triggers for participant count management
- Scheduled cleanup job for expired meetups

This provides better performance, data integrity, and query capabilities over the previous schema. 