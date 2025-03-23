#!/bin/bash

# Set environment variables for psql connection
# Replace YOUR_PASSWORD with your actual password
export PGPASSWORD=

# Run the test script
psql -h db.cgqwaihuqfdbzkoxygpo.supabase.co -p 5432 -d postgres -U postgres -f scripts/test_population_density.sql

# Clear the password from environment for security
unset PGPASSWORD 