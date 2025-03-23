-- Comprehensive Property Valuation Test Script
-- Tests the enhanced property valuation system with multiple value factors

-- Run the comprehensive test function
SELECT * FROM public.test_comprehensive_property_values();

-- Show detailed valuation factors for the most valuable test property
SELECT 
  pv.property_id,
  vp.name AS property_name,
  vp.city,
  pv.factor_category,
  pv.factor_name,
  pv.factor_value,
  pv.confidence,
  pv.source
FROM 
  public.property_valuation_factors pv
JOIN 
  public.virtual_properties vp ON pv.property_id = vp.id
WHERE 
  vp.name = (
    SELECT name FROM public.virtual_properties 
    WHERE name LIKE 'Test Dynamic %' 
    ORDER BY current_value DESC 
    LIMIT 1
  )
ORDER BY 
  pv.factor_category,
  pv.factor_name,
  pv.confidence DESC; 