-- Virtual Property System Migration
-- Part 2 of the Community Growth System Implementation

-- Begin transaction
BEGIN;

-- Check if PostGIS extension is available and enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS postgis;
    RAISE NOTICE 'PostGIS extension has been enabled';
  END IF;
END $$;

-- Virtual Properties
CREATE TABLE IF NOT EXISTS public.virtual_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  property_type TEXT NOT NULL, -- 'micro_location', 'neighborhood', 'district', 'landmark'
  geometry GEOGRAPHY(POLYGON) NOT NULL,
  center_point GEOGRAPHY(POINT) NOT NULL,
  city TEXT NOT NULL,
  base_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  is_for_sale BOOLEAN DEFAULT false,
  asking_price INTEGER,
  metadata JSONB
);

-- Property Transaction History
CREATE TABLE IF NOT EXISTS public.property_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.virtual_properties(id),
  seller_id UUID REFERENCES auth.users(id),
  buyer_id UUID REFERENCES auth.users(id),
  transaction_price INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'initial_sale', 'user_to_user', 'system_reclaim'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Property Income Records
CREATE TABLE IF NOT EXISTS public.property_income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.virtual_properties(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  credits_earned INTEGER NOT NULL,
  calculation_period TSTZRANGE NOT NULL,
  meetups_count INTEGER NOT NULL,
  participants_count INTEGER NOT NULL,
  premium_usage_factor NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Property Value Factors
CREATE TABLE IF NOT EXISTS public.property_value_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.virtual_properties(id),
  factor_type TEXT NOT NULL, -- 'meetup_density', 'user_growth', 'premium_usage', etc.
  factor_value NUMERIC(6,2) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_to TIMESTAMP WITH TIME ZONE
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_virtual_properties_owner_id ON public.virtual_properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_virtual_properties_for_sale ON public.virtual_properties(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_virtual_properties_city ON public.virtual_properties(city);
CREATE INDEX IF NOT EXISTS idx_property_transactions_property_id ON public.property_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_income_owner_id ON public.property_income_records(owner_id);

-- Create spatial indices on property geometries
CREATE INDEX IF NOT EXISTS idx_virtual_properties_geometry ON public.virtual_properties USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_virtual_properties_center ON public.virtual_properties USING GIST(center_point);

-- Add row level security to tables
ALTER TABLE IF EXISTS public.virtual_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_value_factors ENABLE ROW LEVEL SECURITY;

-- Create policies for virtual_properties
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'virtual_properties' 
    AND policyname = 'Public properties are viewable by everyone'
  ) THEN
    CREATE POLICY "Public properties are viewable by everyone" 
      ON public.virtual_properties FOR SELECT 
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'virtual_properties' 
    AND policyname = 'Users can update their own properties'
  ) THEN
    CREATE POLICY "Users can update their own properties" 
      ON public.virtual_properties FOR UPDATE 
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- Create policies for property_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'property_transactions' 
    AND policyname = 'Users can view transactions they were involved in'
  ) THEN
    CREATE POLICY "Users can view transactions they were involved in" 
      ON public.property_transactions FOR SELECT 
      USING (seller_id = auth.uid() OR buyer_id = auth.uid());
  END IF;
END $$;

-- Create policies for property_income_records
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'property_income_records' 
    AND policyname = 'Users can view their own property income'
  ) THEN
    CREATE POLICY "Users can view their own property income" 
      ON public.property_income_records FOR SELECT 
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- Create policies for property_value_factors
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'property_value_factors' 
    AND policyname = 'Everyone can view property value factors'
  ) THEN
    CREATE POLICY "Everyone can view property value factors" 
      ON public.property_value_factors FOR SELECT 
      USING (true);
  END IF;
END $$;

-- Function to get properties within a geographic area
CREATE OR REPLACE FUNCTION public.get_properties_in_area(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius INTEGER DEFAULT 5000, -- Default 5km radius
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_center GEOGRAPHY;
  v_result JSONB;
BEGIN
  -- Create center point geometry
  v_center := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY;
  
  -- Fetch properties within radius
  WITH nearby_properties AS (
    SELECT 
      id,
      name,
      property_type,
      city,
      current_value,
      owner_id,
      is_for_sale,
      asking_price,
      ST_Distance(center_point, v_center) AS distance,
      center_point,
      case when owner_id = auth.uid() then true else false end as is_owned_by_me
    FROM public.virtual_properties
    WHERE ST_DWithin(center_point, v_center, p_radius)
    ORDER BY distance
    LIMIT p_limit
  )
  SELECT jsonb_build_object(
    'properties', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', np.id,
        'name', np.name,
        'property_type', np.property_type,
        'city', np.city,
        'current_value', np.current_value,
        'has_owner', np.owner_id IS NOT NULL,
        'is_owned_by_me', np.is_owned_by_me,
        'is_for_sale', np.is_for_sale,
        'asking_price', np.asking_price,
        'distance_meters', round(np.distance::numeric, 2),
        'location', json_build_object(
          'lat', ST_Y(np.center_point::geometry),
          'lng', ST_X(np.center_point::geometry)
        )
      )
    ), '[]'::jsonb)
  ) INTO v_result
  FROM nearby_properties np;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to get a user's properties
CREATE OR REPLACE FUNCTION public.get_my_properties(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_total INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Count total properties owned by user
  SELECT COUNT(*) INTO v_total
  FROM public.virtual_properties
  WHERE owner_id = v_user_id;
  
  -- Get properties with income stats
  WITH user_properties AS (
    SELECT 
      p.id,
      p.name,
      p.property_type,
      p.city,
      p.base_value,
      p.current_value,
      p.is_for_sale,
      p.asking_price,
      p.created_at,
      p.last_transaction_at,
      p.center_point,
      COALESCE(
        (SELECT SUM(credits_earned) 
         FROM public.property_income_records 
         WHERE property_id = p.id),
        0
      ) AS total_income,
      COALESCE(
        (SELECT COUNT(*) 
         FROM public.property_income_records 
         WHERE property_id = p.id),
        0
      ) AS income_periods
    FROM public.virtual_properties p
    WHERE p.owner_id = v_user_id
    ORDER BY p.last_transaction_at DESC NULLS LAST, p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'properties', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', up.id,
        'name', up.name,
        'property_type', up.property_type,
        'city', up.city,
        'base_value', up.base_value,
        'current_value', up.current_value,
        'is_for_sale', up.is_for_sale,
        'asking_price', up.asking_price,
        'acquired_at', up.last_transaction_at,
        'created_at', up.created_at,
        'total_income', up.total_income,
        'income_periods', up.income_periods,
        'location', json_build_object(
          'lat', ST_Y(up.center_point::geometry),
          'lng', ST_X(up.center_point::geometry)
        )
      )
    ), '[]'::jsonb)
  ) INTO v_result
  FROM user_properties up;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to get property income history
CREATE OR REPLACE FUNCTION public.get_property_income_history(
  p_property_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_total INTEGER;
  v_property_owner UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check property ownership
  SELECT owner_id INTO v_property_owner
  FROM public.virtual_properties
  WHERE id = p_property_id;
  
  IF v_property_owner IS DISTINCT FROM v_user_id THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You do not own this property'
    );
  END IF;
  
  -- Count total income records for this property
  SELECT COUNT(*) INTO v_total
  FROM public.property_income_records
  WHERE property_id = p_property_id;
  
  -- Get income records
  WITH income_records AS (
    SELECT 
      id,
      credits_earned,
      calculation_period,
      meetups_count,
      participants_count,
      premium_usage_factor,
      created_at
    FROM public.property_income_records
    WHERE property_id = p_property_id
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'property_id', p_property_id,
    'total_records', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'records', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', ir.id,
        'credits_earned', ir.credits_earned,
        'period_start', lower(ir.calculation_period),
        'period_end', upper(ir.calculation_period),
        'meetups_count', ir.meetups_count,
        'participants_count', ir.participants_count,
        'premium_usage_factor', ir.premium_usage_factor,
        'created_at', ir.created_at
      )
    ), '[]'::jsonb)
  ) INTO v_result
  FROM income_records ir;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to purchase a property
CREATE OR REPLACE FUNCTION public.purchase_property(
  p_property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_property_record public.virtual_properties%ROWTYPE;
  v_transaction_id UUID;
  v_seller_id UUID;
  v_price INTEGER;
  v_credit_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get property details
  SELECT * INTO v_property_record
  FROM public.virtual_properties
  WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Property not found'
    );
  END IF;
  
  -- Check if property is for sale
  IF NOT v_property_record.is_for_sale THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Property is not for sale'
    );
  END IF;
  
  -- Determine price and seller
  v_seller_id := v_property_record.owner_id;
  v_price := COALESCE(v_property_record.asking_price, v_property_record.current_value);
  
  -- Use credits for purchase
  v_credit_result := public.use_user_credits(
    v_user_id,
    v_price,
    'property_purchase',
    p_property_id,
    'virtual_property',
    jsonb_build_object(
      'property_name', v_property_record.name,
      'property_type', v_property_record.property_type,
      'city', v_property_record.city
    )
  );
  
  IF NOT (v_credit_result->>'success')::BOOLEAN THEN
    RETURN v_credit_result; -- Return the error from credit deduction
  END IF;
  
  -- Credit seller if not null (system sale)
  IF v_seller_id IS NOT NULL THEN
    PERFORM public.add_user_credits(
      v_seller_id,
      v_price,
      'property_sale',
      p_property_id,
      'virtual_property',
      jsonb_build_object(
        'property_name', v_property_record.name,
        'property_type', v_property_record.property_type,
        'city', v_property_record.city,
        'buyer_id', v_user_id
      )
    );
  END IF;
  
  -- Record the transaction
  INSERT INTO public.property_transactions (
    property_id,
    seller_id,
    buyer_id,
    transaction_price,
    transaction_type
  ) VALUES (
    p_property_id,
    v_seller_id,
    v_user_id,
    v_price,
    CASE 
      WHEN v_seller_id IS NULL THEN 'initial_sale'
      ELSE 'user_to_user'
    END
  ) RETURNING id INTO v_transaction_id;
  
  -- Update property record
  UPDATE public.virtual_properties
  SET 
    owner_id = v_user_id,
    is_for_sale = false,
    asking_price = NULL,
    last_transaction_at = now()
  WHERE id = p_property_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', TRUE,
    'transaction_id', v_transaction_id,
    'property_id', p_property_id,
    'price_paid', v_price,
    'seller_id', v_seller_id,
    'message', 'Property purchased successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Roll back any failed transaction
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to list a property for sale
CREATE OR REPLACE FUNCTION public.list_property_for_sale(
  p_property_id UUID,
  p_asking_price INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_property_owner UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check property ownership
  SELECT owner_id INTO v_property_owner
  FROM public.virtual_properties
  WHERE id = p_property_id;
  
  IF v_property_owner IS DISTINCT FROM v_user_id THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You do not own this property'
    );
  END IF;
  
  -- Validate asking price
  IF p_asking_price <= 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Asking price must be greater than zero'
    );
  END IF;
  
  -- Update property to list for sale
  UPDATE public.virtual_properties
  SET 
    is_for_sale = true,
    asking_price = p_asking_price
  WHERE id = p_property_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', TRUE,
    'property_id', p_property_id,
    'asking_price', p_asking_price,
    'listed_at', now(),
    'message', 'Property listed for sale successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to cancel a property listing
CREATE OR REPLACE FUNCTION public.cancel_property_listing(
  p_property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_property_owner UUID;
  v_is_for_sale BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check property ownership and status
  SELECT 
    owner_id,
    is_for_sale 
  INTO 
    v_property_owner,
    v_is_for_sale
  FROM public.virtual_properties
  WHERE id = p_property_id;
  
  IF v_property_owner IS DISTINCT FROM v_user_id THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You do not own this property'
    );
  END IF;
  
  IF NOT v_is_for_sale THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'This property is not currently listed for sale'
    );
  END IF;
  
  -- Update property to cancel listing
  UPDATE public.virtual_properties
  SET 
    is_for_sale = false,
    asking_price = NULL
  WHERE id = p_property_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', TRUE,
    'property_id', p_property_id,
    'message', 'Property listing cancelled successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to create property income records (to be called by scheduler)
CREATE OR REPLACE FUNCTION public.generate_property_income(
  p_days INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_record RECORD;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_income INTEGER;
  v_meetups_count INTEGER;
  v_participants_count INTEGER;
  v_premium_factor NUMERIC(5,2);
  v_records_created INTEGER := 0;
BEGIN
  -- Set calculation period (previous days)
  v_period_end := date_trunc('day', now());
  v_period_start := v_period_end - (p_days || ' days')::INTERVAL;
  
  -- Loop through each owned property
  FOR v_property_record IN 
    SELECT 
      id, 
      owner_id, 
      property_type, 
      city, 
      current_value,
      geometry
    FROM public.virtual_properties
    WHERE owner_id IS NOT NULL
  LOOP
    -- Count meetups in this property during the period
    SELECT 
      COUNT(*) AS meetup_count,
      COALESCE(SUM(current_participants), 0) AS participant_count
    INTO
      v_meetups_count,
      v_participants_count
    FROM public.meetups
    WHERE 
      ST_Intersects(location::geometry, v_property_record.geometry::geometry)
      AND created_at BETWEEN v_period_start AND v_period_end;
    
    -- Skip if no activity
    IF v_meetups_count = 0 THEN
      CONTINUE;
    END IF;
    
    -- Calculate premium usage factor (placeholder - implement actual logic)
    v_premium_factor := 1.0;
    
    -- Calculate income based on property value and activity
    -- This is a simplified formula - implement actual calculation
    v_income := GREATEST(
      5, -- Minimum 5 credits
      (v_property_record.current_value * 0.001 * v_meetups_count * v_premium_factor)::INTEGER
    );
    
    -- Create income record
    INSERT INTO public.property_income_records (
      property_id,
      owner_id,
      credits_earned,
      calculation_period,
      meetups_count,
      participants_count,
      premium_usage_factor
    ) VALUES (
      v_property_record.id,
      v_property_record.owner_id,
      v_income,
      tstzrange(v_period_start, v_period_end, '[]'),
      v_meetups_count,
      v_participants_count,
      v_premium_factor
    );
    
    -- Add credits to owner
    PERFORM public.add_user_credits(
      v_property_record.owner_id,
      v_income,
      'property_income',
      v_property_record.id,
      'virtual_property',
      jsonb_build_object(
        'period_start', v_period_start,
        'period_end', v_period_end,
        'meetups_count', v_meetups_count,
        'participants_count', v_participants_count
      )
    );
    
    v_records_created := v_records_created + 1;
  END LOOP;
  
  RETURN v_records_created;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error generating property income: %', SQLERRM;
  RETURN -1;
END;
$$;

-- Set up scheduled task to generate property income daily
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule daily income generation at 2am
    PERFORM cron.schedule(
      'property-income-daily',
      '0 2 * * *',
      $cmd$SELECT public.generate_property_income(1)$cmd$
    );
    RAISE NOTICE 'Daily property income task scheduled using pg_cron';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - automated income generation not scheduled';
  END IF;
END $$;

-- Grant usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions to tables
GRANT SELECT ON public.virtual_properties TO anon, authenticated;
GRANT SELECT ON public.property_transactions TO authenticated;
GRANT SELECT ON public.property_income_records TO authenticated;
GRANT SELECT ON public.property_value_factors TO anon, authenticated;

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION public.get_properties_in_area TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_properties TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_income_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_property_for_sale TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_property_listing TO authenticated;

COMMIT; 