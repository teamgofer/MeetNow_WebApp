-- Automated tests for MeetNow database functions
-- Run this file with: psql -f test/db_function_tests.sql

-- Setup test environment
DO $$
BEGIN
    RAISE NOTICE '--- 🧪 Starting MeetNow Database Function Tests ---';
END $$;

-- Test Timezone Functions
DO $$
DECLARE
    test_count INTEGER := 0;
    pass_count INTEGER := 0;
    fail_count INTEGER := 0;
    test_result TEXT;
    timezone_result TEXT;
BEGIN
    RAISE NOTICE 'Testing get_timezone_from_coordinates function...';
    
    -- Test 1: San Francisco should return America/Los_Angeles
    timezone_result := get_timezone_from_coordinates(37.7749, -122.4194);
    test_result := CASE WHEN timezone_result = 'America/Los_Angeles' THEN 'PASS' ELSE 'FAIL' END;
    test_count := test_count + 1;
    IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
    RAISE NOTICE 'Test 1: San Francisco timezone - Expected: America/Los_Angeles, Got: % - %', timezone_result, test_result;
    
    -- Test 2: Mexico City should return America/Mexico_City
    timezone_result := get_timezone_from_coordinates(19.4326, -99.1332);
    test_result := CASE WHEN timezone_result = 'America/Mexico_City' THEN 'PASS' ELSE 'FAIL' END;
    test_count := test_count + 1;
    IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
    RAISE NOTICE 'Test 2: Mexico City timezone - Expected: America/Mexico_City, Got: % - %', timezone_result, test_result;
    
    -- Test 3: New York should return America/New_York
    timezone_result := get_timezone_from_coordinates(40.7128, -74.0060);
    test_result := CASE WHEN timezone_result = 'America/New_York' THEN 'PASS' ELSE 'FAIL' END;
    test_count := test_count + 1;
    IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
    RAISE NOTICE 'Test 3: New York timezone - Expected: America/New_York, Got: % - %', timezone_result, test_result;
    
    -- Test 4: Invalid coordinates should default to America/Los_Angeles
    timezone_result := get_timezone_from_coordinates(NULL, NULL);
    test_result := CASE WHEN timezone_result = 'America/Los_Angeles' THEN 'PASS' ELSE 'FAIL' END;
    test_count := test_count + 1;
    IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
    RAISE NOTICE 'Test 4: NULL coordinates timezone - Expected: America/Los_Angeles, Got: % - %', timezone_result, test_result;
    
    -- Test 5: Antarctica should default to America/Los_Angeles
    timezone_result := get_timezone_from_coordinates(-82.8628, 135.0000);
    test_result := CASE WHEN timezone_result = 'America/Los_Angeles' THEN 'PASS' ELSE 'FAIL' END;
    test_count := test_count + 1;
    IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
    RAISE NOTICE 'Test 5: Antarctica timezone - Expected: America/Los_Angeles, Got: % - %', timezone_result, test_result;
    
    -- Summary
    RAISE NOTICE 'Timezone Function Test Summary: % tests, % passed, % failed', test_count, pass_count, fail_count;
END $$;

-- Test create_meetup function
DO $$
DECLARE
    test_count INTEGER := 0;
    pass_count INTEGER := 0;
    fail_count INTEGER := 0;
    test_result TEXT;
    meetup_result JSONB;
    starts_at TIMESTAMP WITH TIME ZONE;
    expires_at TIMESTAMP WITH TIME ZONE;
    duration_minutes INTEGER;
BEGIN
    RAISE NOTICE 'Testing create_meetup function...';
    
    -- Test transaction to avoid affecting real data
    BEGIN
        -- Save current time for comparison
        starts_at := current_timestamp;
        duration_minutes := 90;
        
        -- Test 1: Create a meetup and verify timestamps
        meetup_result := create_meetup(
            'Test Meetup', 
            'Test Description', 
            '123 Test Street, San Francisco', 
            37.7749, 
            -122.4194, 
            NULL, 
            '00000000-0000-0000-0000-000000000000'::UUID,
            duration_minutes
        );
        
        -- Calculate expected expiry time
        expires_at := starts_at + (duration_minutes * interval '1 minute');
        
        -- Check that the result contains proper timestamp field
        test_result := CASE 
                          WHEN meetup_result ? 'starts_at' 
                               AND (meetup_result->>'starts_at')::TIMESTAMP WITH TIME ZONE >= starts_at - interval '5 seconds'
                               AND (meetup_result->>'starts_at')::TIMESTAMP WITH TIME ZONE <= starts_at + interval '5 seconds'
                          THEN 'PASS' 
                          ELSE 'FAIL' 
                       END;
        test_count := test_count + 1;
        IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
        RAISE NOTICE 'Test 1: Meetup start time - Expected around %, Got: % - %', 
                    starts_at, 
                    (meetup_result->>'starts_at')::TIMESTAMP WITH TIME ZONE, 
                    test_result;
        
        -- Check that expiry time is calculated correctly
        test_result := CASE 
                          WHEN meetup_result ? 'expires_at' 
                               AND meetup_result ? 'starts_at'
                               AND ((meetup_result->>'expires_at')::TIMESTAMP WITH TIME ZONE - 
                                   (meetup_result->>'starts_at')::TIMESTAMP WITH TIME ZONE) 
                                       BETWEEN (duration_minutes * interval '1 minute' - interval '5 seconds') 
                                              AND (duration_minutes * interval '1 minute' + interval '5 seconds')
                          THEN 'PASS' 
                          ELSE 'FAIL' 
                       END;
        test_count := test_count + 1;
        IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
        RAISE NOTICE 'Test 2: Meetup expiry time - Expected starts_at + % minutes, Got difference: % - %', 
                    duration_minutes, 
                    ((meetup_result->>'expires_at')::TIMESTAMP WITH TIME ZONE - 
                     (meetup_result->>'starts_at')::TIMESTAMP WITH TIME ZONE), 
                    test_result;
        
        -- Check that duration is stored correctly
        test_result := CASE 
                          WHEN meetup_result ? 'duration_minutes' 
                               AND (meetup_result->>'duration_minutes')::INTEGER = duration_minutes
                          THEN 'PASS' 
                          ELSE 'FAIL' 
                       END;
        test_count := test_count + 1;
        IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
        RAISE NOTICE 'Test 3: Duration minutes - Expected: %, Got: % - %', 
                    duration_minutes, 
                    (meetup_result->>'duration_minutes')::INTEGER, 
                    test_result;
        
        -- Rollback the test transaction
        RAISE EXCEPTION 'Rollback test transaction';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM = 'Rollback test transaction' THEN
                -- Expected exception for rollback
                NULL;
            ELSE
                -- Unexpected error
                RAISE NOTICE 'Test Error: %', SQLERRM;
                fail_count := test_count - pass_count;
            END IF;
    END;
    
    -- Summary
    RAISE NOTICE 'Create Meetup Function Test Summary: % tests, % passed, % failed', test_count, pass_count, fail_count;
END $$;

-- Test credit system functions
DO $$
DECLARE
    test_count INTEGER := 0;
    pass_count INTEGER := 0;
    fail_count INTEGER := 0;
    test_result TEXT;
    credits_required INTEGER;
BEGIN
    RAISE NOTICE 'Testing credit calculation functions...';
    
    -- Test 1: 60 minute meetup should require 0 credits
    BEGIN
        credits_required := calculate_required_credits(60);
        test_result := CASE WHEN credits_required = 0 THEN 'PASS' ELSE 'FAIL' END;
        test_count := test_count + 1;
        IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
        RAISE NOTICE 'Test 1: 60 minute meetup credits - Expected: 0, Got: % - %', credits_required, test_result;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Test 1 Error: %', SQLERRM;
            test_count := test_count + 1;
            fail_count := fail_count + 1;
    END;
    
    -- Test 2: 120 minute meetup should require more than 0 credits
    BEGIN
        credits_required := calculate_required_credits(120);
        test_result := CASE WHEN credits_required > 0 THEN 'PASS' ELSE 'FAIL' END;
        test_count := test_count + 1;
        IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
        RAISE NOTICE 'Test 2: 120 minute meetup credits - Expected: >0, Got: % - %', credits_required, test_result;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Test 2 Error: %', SQLERRM;
            test_count := test_count + 1;
            fail_count := fail_count + 1;
    END;
    
    -- Test 3: Credit calculation should scale with duration
    BEGIN
        DECLARE
            credits_120 INTEGER;
            credits_180 INTEGER;
        BEGIN
            credits_120 := calculate_required_credits(120);
            credits_180 := calculate_required_credits(180);
            test_result := CASE WHEN credits_180 > credits_120 THEN 'PASS' ELSE 'FAIL' END;
            test_count := test_count + 1;
            IF test_result = 'PASS' THEN pass_count := pass_count + 1; ELSE fail_count := fail_count + 1; END IF;
            RAISE NOTICE 'Test 3: Credit scaling - 120 min: %, 180 min: % - %', credits_120, credits_180, test_result;
        END;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Test 3 Error: %', SQLERRM;
            test_count := test_count + 1;
            fail_count := fail_count + 1;
    END;
    
    -- Summary
    RAISE NOTICE 'Credit Function Test Summary: % tests, % passed, % failed', test_count, pass_count, fail_count;
END $$;

-- Overall test summary
DO $$
BEGIN
    RAISE NOTICE '--- 🧪 MeetNow Database Function Tests Complete ---';
END $$; 