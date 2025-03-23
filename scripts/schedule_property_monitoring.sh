#!/bin/bash
# Property Valuation System - Monitoring and Maintenance Script
# Set this up as a daily cron job

# Configuration
DB_NAME="postgres"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
LOG_DIR="/var/log/meetnow/property-valuation"
LOG_FILE="$LOG_DIR/property_monitor_$(date +%Y%m%d).log"
REPORT_DIR="/var/www/meetnow/reports/property-valuation"
REPORT_FILE="$REPORT_DIR/valuation_report_$(date +%Y%m%d).html"
ALERT_EMAIL="admin@meetnow.app"
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ensure log directory exists
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

# Helper functions
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Start monitoring process
log "Starting property valuation monitoring"

# 1. Run health check and tests
log "Running database health checks..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
  -f "$SCRIPTS_DIR/property_valuation_monitor.sql" \
  > "$LOG_DIR/health_check.txt" 2>&1

# Check for any warnings in the health check
WARNING_COUNT=$(grep -c "WARNING" "$LOG_DIR/health_check.txt")
if [ $WARNING_COUNT -gt 0 ]; then
  log "Found $WARNING_COUNT warnings in health check"
  # Send email alert
  cat "$LOG_DIR/health_check.txt" | mail -s "MeetNow Property Valuation: $WARNING_COUNT Warning(s)" "$ALERT_EMAIL"
else
  log "Health check completed successfully with no warnings"
fi

# 2. Run comprehensive tests
log "Running validation tests..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
  -f "$SCRIPTS_DIR/property_valuation_tests.sql" \
  > "$LOG_DIR/validation_tests.txt" 2>&1

# Check for any test failures
FAILURE_COUNT=$(grep -c "FAILED" "$LOG_DIR/validation_tests.txt")
if [ $FAILURE_COUNT -gt 0 ]; then
  log "Found $FAILURE_COUNT test failures"
  # Send email alert
  cat "$LOG_DIR/validation_tests.txt" | mail -s "MeetNow Property Valuation: $FAILURE_COUNT Test Failure(s)" "$ALERT_EMAIL"
else
  log "All tests passed successfully"
fi

# 3. Generate HTML report
log "Generating HTML report..."
cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
  <title>MeetNow Property Valuation Report - $(date +"%Y-%m-%d")</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .warning { color: orange; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>MeetNow Property Valuation System Report</h1>
  <p>Generated on: $(date +"%Y-%m-%d %H:%M:%S")</p>
  
  <h2>System Health Check</h2>
  <pre>$(grep -A 20 "System Health Check" "$LOG_DIR/health_check.txt")</pre>
  
  <h2>Data Integrity</h2>
  <pre>$(grep -A 20 "Data Integrity Check" "$LOG_DIR/health_check.txt")</pre>
  
  <h2>API Usage Statistics</h2>
  <pre>$(grep -A 20 "API Usage Statistics" "$LOG_DIR/health_check.txt")</pre>
  
  <h2>Valuation Distribution</h2>
  <pre>$(grep -A 20 "Valuation Distribution Analysis" "$LOG_DIR/health_check.txt")</pre>
  
  <h2>Test Results</h2>
  <pre>$(grep "TEST" "$LOG_DIR/validation_tests.txt")</pre>
  
  <h2>Maintenance Actions</h2>
  <pre>$(grep -A 20 "Schedule Automated Valuation\|Cleanup Actions" "$LOG_DIR/health_check.txt")</pre>
</body>
</html>
EOF

log "HTML report generated at $REPORT_FILE"

# 4. Scheduled data maintenance
log "Running scheduled maintenance tasks..."

# 4.1 Update all property values once a week (on Sundays)
if [ "$(date +%u)" -eq 7 ]; then
  log "Sunday maintenance: Updating all property values..."
  psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
    -c "SELECT public.update_all_property_values_comprehensive();" \
    >> "$LOG_FILE" 2>&1
fi

# 4.2 Vacuum analyze tables once a month (on 1st day)
if [ "$(date +%d)" -eq 1 ]; then
  log "Monthly maintenance: Vacuum analyzing tables..."
  psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
    -c "VACUUM ANALYZE public.virtual_properties; VACUUM ANALYZE public.property_valuation_factors; VACUUM ANALYZE public.external_api_cache;" \
    >> "$LOG_FILE" 2>&1
fi

log "Property valuation monitoring completed"

# Usage instructions (in comments)
# To set up as a daily cron job, run:
# crontab -e
# Then add:
# 0 1 * * * /path/to/scripts/schedule_property_monitoring.sh >/dev/null 2>&1
#
# This will run the script every day at 1:00 AM 