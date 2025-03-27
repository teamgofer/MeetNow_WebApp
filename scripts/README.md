# MeetNow Scripts

This directory contains utility scripts for the MeetNow webapp, organized for better maintainability and clarity.

## Directory Structure

- **db/** - Database-related scripts
  - SQL queries
  - Database utilities
  - Database testing scripts
  
  - **migrations/** - Database migration scripts
    - Schema changes
    - Data migrations
    - Timezone fixes

- **dev/** - Development utilities
  - Development helpers
  - Local environment setup
  - Frontend fixes and utilities

- **ci/** - Continuous integration scripts
  - Build scripts
  - Deployment helpers
  - Testing automation

## Using Scripts

### Database Scripts

Database scripts are used for managing and maintaining the database schema and data.

Example:
```bash
psql -d meetnow -f scripts/db/migrations/meetup_timestamp_fix.sql
```

### Development Scripts

Development scripts are used for local development tasks.

Example:
```bash
node scripts/dev/fix_frontend_timezone_display.js
```

## Maintenance

When adding new scripts:
1. Place them in the appropriate subdirectory
2. Follow the existing naming conventions
3. Document their purpose and usage
4. Ensure they are executable (chmod +x for bash scripts)

## Security Considerations

Scripts that handle sensitive data or perform critical operations should:
1. Include appropriate error handling
2. Validate inputs
3. Respect least privilege principles
4. Be documented with necessary precautions 