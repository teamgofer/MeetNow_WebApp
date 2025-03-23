#!/bin/bash
# MeetNow Complete Test Suite Runner
# Run with: bash test/run_all_tests.sh

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 MeetNow Complete Test Suite Runner${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Step 1: Run JavaScript tests
echo -e "${YELLOW}Running JavaScript Tests...${NC}"
node test/test_runner.js
JS_RESULT=$?

# Remember the JavaScript test result
if [ $JS_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}✅ JavaScript Tests PASSED${NC}\n"
else
  echo -e "\n${RED}❌ JavaScript Tests FAILED${NC}\n"
fi

# Step 2: Check if psql is available for SQL tests
echo -e "${YELLOW}Checking for PostgreSQL client...${NC}"
if command -v psql >/dev/null 2>&1; then
  echo -e "${GREEN}PostgreSQL client found, will run SQL tests${NC}\n"
  
  # SQL tests should be run against a test database or with rollback transactions
  echo -e "${YELLOW}Running SQL Tests...${NC}"
  echo -e "${YELLOW}Note: These tests are designed to be run against a test database${NC}"
  echo -e "${YELLOW}or using transaction rollbacks to prevent data changes${NC}\n"
  
  echo -e "Would you like to run the SQL tests? They will connect to your Supabase database."
  echo -e "Type 'yes' to continue or anything else to skip: "
  read -r RUN_SQL_TESTS
  
  if [ "$RUN_SQL_TESTS" = "yes" ]; then
    # Get connection details
    echo -e "Enter your Supabase PostgreSQL connection string or URL:"
    read -r DB_URL
    
    if [ -n "$DB_URL" ]; then
      echo -e "\n${YELLOW}Running SQL tests...${NC}"
      psql "$DB_URL" -f test/db_function_tests.sql
      SQL_RESULT=$?
      
      if [ $SQL_RESULT -eq 0 ]; then
        echo -e "\n${GREEN}✅ SQL Tests Completed${NC}"
      else
        echo -e "\n${RED}❌ SQL Tests Failed${NC}"
      fi
    else
      echo -e "\n${RED}No database URL provided. Skipping SQL tests.${NC}"
      SQL_RESULT=2
    fi
  else
    echo -e "\n${YELLOW}SQL Tests skipped.${NC}"
    SQL_RESULT=2
  fi
else
  echo -e "${RED}PostgreSQL client not found. Skipping SQL tests.${NC}"
  SQL_RESULT=2
fi

# Step 3: Final summary
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}🧪 Test Run Summary${NC}"
echo -e "${BLUE}=====================================${NC}"

if [ $JS_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ JavaScript Tests: PASSED${NC}"
else
  echo -e "${RED}❌ JavaScript Tests: FAILED${NC}"
fi

if [ $SQL_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ SQL Tests: PASSED${NC}"
elif [ $SQL_RESULT -eq 2 ]; then
  echo -e "${YELLOW}⚠️ SQL Tests: SKIPPED${NC}"
else
  echo -e "${RED}❌ SQL Tests: FAILED${NC}"
fi

# Exit with success only if all tests passed
if [ $JS_RESULT -eq 0 ] && ([ $SQL_RESULT -eq 0 ] || [ $SQL_RESULT -eq 2 ]); then
  echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Some tests failed.${NC}"
  exit 1
fi 