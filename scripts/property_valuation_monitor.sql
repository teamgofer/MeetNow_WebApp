-- Property Valuation System Monitoring Script
-- Run this regularly (e.g., daily) to check system health and integrity

------------------------------------------
-- System Health Check
------------------------------------------

-- 1. Check API profiles health
WITH api_stats AS (
  SELECT 
    COUNT(*) AS total_apis,
    SUM(CASE WHEN enabled = TRUE THEN 1 ELSE 0 END) AS enabled_apis,
    MAX(updated_at) AS last_updated
  FROM 
    public.real_estate_api_profiles
)
SELECT 
  total_apis,
  enabled_apis,
  last_updated,
  CASE 
    WHEN enabled_apis < 3 THEN 'WARNING: Fewer than 3 enabled API profiles'
    WHEN NOW() - last_updated > INTERVAL '30 days' THEN 'WARNING: API profiles not updated in 30+ days'
    ELSE 'OK'
  END AS status
FROM 
  api_stats;

-- 2. Check cache health
WITH cache_stats AS (
  SELECT 
    COUNT(*) AS total_cache_entries,
    COUNT(*) FILTER (WHERE expires_at < NOW()) AS expired_entries,
    MAX(last_accessed) AS last_accessed,
    MIN(expires_at) AS next_expiry
  FROM 
    public.external_api_cache
  WHERE 
    cache_key LIKE 'property_valuation:%'
)
SELECT 
  total_cache_entries,
  expired_entries,
  last_accessed,
  next_expiry,
  CASE 
    WHEN expired_entries > 0 THEN 'WARNING: ' || expired_entries || ' expired cache entries'
    WHEN total_cache_entries = 0 THEN 'WARNING: No cache entries found'
    ELSE 'OK'
  END AS status
FROM 
  cache_stats;

-- 3. Check valuation factors health
WITH factor_stats AS (
  SELECT 
    COUNT(DISTINCT property_id) AS properties_with_factors,
    COUNT(*) AS total_factors,
    MAX(created_at) AS last_factor_created
  FROM 
    public.property_valuation_factors
)
SELECT 
  properties_with_factors,
  total_factors,
  last_factor_created,
  CASE 
    WHEN properties_with_factors = 0 THEN 'WARNING: No properties with valuation factors'
    WHEN NOW() - last_factor_created > INTERVAL '7 days' THEN 'WARNING: No new factors in 7+ days'
    ELSE 'OK'
  END AS status
FROM 
  factor_stats;

------------------------------------------
-- Data Integrity Check
------------------------------------------

-- 4. Check for properties missing valuation
SELECT 
  COUNT(*) AS properties_missing_valuation,
  CASE 
    WHEN COUNT(*) > 0 THEN 'WARNING: ' || COUNT(*) || ' properties missing valuation'
    ELSE 'OK'
  END AS status
FROM 
  public.virtual_properties
WHERE 
  last_valuation_date IS NULL OR current_value IS NULL OR current_value = 0;

-- 5. Check for extreme valuation multipliers
SELECT 
  COUNT(*) AS extreme_multipliers,
  CASE 
    WHEN COUNT(*) > 0 THEN 'WARNING: ' || COUNT(*) || ' properties with extreme multipliers'
    ELSE 'OK'
  END AS status
FROM 
  public.virtual_properties
WHERE 
  current_value / NULLIF(base_value, 0) > 10 OR current_value / NULLIF(base_value, 0) < 0.1;

-- 6. Check for valuation factors with suspicious values
SELECT 
  COUNT(*) AS suspicious_factors,
  CASE 
    WHEN COUNT(*) > 0 THEN 'WARNING: ' || COUNT(*) || ' suspicious valuation factors'
    ELSE 'OK'
  END AS status
FROM 
  public.property_valuation_factors
WHERE 
  factor_value > 100 OR factor_value < 0;

------------------------------------------
-- API Usage Statistics
------------------------------------------

-- 7. Check API usage
SELECT 
  api_name,
  endpoint,
  COUNT(*) AS calls,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) AS cached_calls,
  MAX(created_at) AS last_call
FROM 
  public.external_api_usage_logs
WHERE 
  created_at > NOW() - INTERVAL '7 days'
GROUP BY 
  api_name, endpoint
ORDER BY 
  calls DESC;

------------------------------------------
-- Valuation Distribution Analysis
------------------------------------------

-- 8. Check valuation distribution by city
SELECT 
  city,
  COUNT(*) AS property_count,
  ROUND(AVG(current_value)) AS avg_value,
  MIN(current_value) AS min_value,
  MAX(current_value) AS max_value,
  ROUND(AVG(current_value / NULLIF(base_value, 0)), 2) AS avg_multiplier
FROM 
  public.virtual_properties
WHERE 
  current_value IS NOT NULL
GROUP BY 
  city
ORDER BY 
  avg_value DESC;

------------------------------------------
-- Schedule Automated Valuation
------------------------------------------

-- 9. Update stale property valuations (older than 7 days)
DO $$
DECLARE
  v_property_id UUID;
  v_updated_count INTEGER := 0;
BEGIN
  FOR v_property_id IN
    SELECT id FROM public.virtual_properties
    WHERE last_valuation_date IS NULL OR last_valuation_date < NOW() - INTERVAL '7 days'
    LIMIT 10 -- Process in batches to avoid overload
  LOOP
    PERFORM public.calculate_property_value_comprehensive(v_property_id);
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  IF v_updated_count > 0 THEN
    RAISE NOTICE 'Updated % stale property valuations', v_updated_count;
  END IF;
END $$;

------------------------------------------
-- Cleanup Actions
------------------------------------------

-- 10. Clean up expired cache entries
DO $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.external_api_cache
  WHERE expires_at < NOW() AND cache_key LIKE 'property_valuation:%'
  RETURNING COUNT(*) INTO v_deleted_count;
  
  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % expired cache entries', v_deleted_count;
  END IF;
END $$;

-- 11. Delete old API usage logs (older than 30 days)
DO $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.external_api_usage_logs
  WHERE created_at < NOW() - INTERVAL '30 days'
  RETURNING COUNT(*) INTO v_deleted_count;
  
  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % old API usage logs', v_deleted_count;
  END IF;
END $$; 