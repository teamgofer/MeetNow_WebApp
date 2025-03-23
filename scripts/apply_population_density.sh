#!/bin/bash
set -e

echo "=== Applying Population Density Migration ==="
psql -f supabase/migrations/20240423_property_external_metrics.sql

echo ""
echo "=== Checking Virtual Properties Schema ==="
psql -f scripts/check_virtual_properties_schema.sql

echo ""
echo "=== Running Population Density Test ==="
psql -f scripts/test_population_density.sql

echo ""
echo "=== DONE ===" 