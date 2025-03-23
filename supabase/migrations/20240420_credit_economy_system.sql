-- Credit Economy System Migration
-- Part 1 of the Community Growth System Implementation

-- Begin transaction
BEGIN;

-- Credit Transaction History
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id UUID, -- Can point to property, promotion, etc.
  reference_type TEXT, -- E.g., 'property_purchase', 'referral_bonus'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB
);

-- Credit Exchange Requests
CREATE TABLE IF NOT EXISTS public.credit_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  credits_amount INTEGER NOT NULL,
  cash_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  payment_details JSONB
);

-- Exchange Rate History
CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits_to_cash_ratio NUMERIC(10,4) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_to TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type_reference ON public.credit_transactions(transaction_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_exchange_requests_user_id ON public.credit_exchange_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_exchange_requests_status ON public.credit_exchange_requests(status);

-- Add row level security to tables
ALTER TABLE IF EXISTS public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exchange_rate_history ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'credit_transactions' 
    AND policyname = 'Users can view their own credit transactions'
  ) THEN
    CREATE POLICY "Users can view their own credit transactions" 
      ON public.credit_transactions FOR SELECT 
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create policies for credit_exchange_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'credit_exchange_requests' 
    AND policyname = 'Users can view their own credit exchange requests'
  ) THEN
    CREATE POLICY "Users can view their own credit exchange requests" 
      ON public.credit_exchange_requests FOR SELECT 
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'credit_exchange_requests' 
    AND policyname = 'Users can create their own credit exchange requests'
  ) THEN
    CREATE POLICY "Users can create their own credit exchange requests" 
      ON public.credit_exchange_requests FOR INSERT 
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Admin policies (will be limited with app-level validation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'exchange_rate_history' 
    AND policyname = 'Admin users can view all exchange rates'
  ) THEN
    CREATE POLICY "Admin users can view all exchange rates" 
      ON public.exchange_rate_history FOR SELECT 
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'exchange_rate_history' 
    AND policyname = 'Admin users can create exchange rates'
  ) THEN
    CREATE POLICY "Admin users can create exchange rates" 
      ON public.exchange_rate_history FOR INSERT 
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- Function to add credits to a user
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Calculate new balance
  v_new_balance := COALESCE(v_current_balance, 0) + p_amount;
  
  -- Update user's balance
  UPDATE public.profiles
  SET credits = v_new_balance
  WHERE id = p_user_id;
  
  -- Record the transaction
  INSERT INTO public.credit_transactions (
    user_id, 
    amount, 
    transaction_type, 
    reference_id, 
    reference_type, 
    details
  ) VALUES (
    p_user_id, 
    p_amount, 
    p_transaction_type, 
    p_reference_id, 
    p_reference_type, 
    p_details
  ) RETURNING id INTO v_transaction_id;
  
  -- Return transaction details
  RETURN jsonb_build_object(
    'success', TRUE,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to use credits (deduction)
CREATE OR REPLACE FUNCTION public.use_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if user has enough credits
  IF COALESCE(v_current_balance, 0) < p_amount THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Insufficient credits',
      'current_balance', v_current_balance,
      'required_amount', p_amount
    );
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update user's balance
  UPDATE public.profiles
  SET credits = v_new_balance
  WHERE id = p_user_id;
  
  -- Record the transaction (negative amount for deduction)
  INSERT INTO public.credit_transactions (
    user_id, 
    amount, 
    transaction_type, 
    reference_id, 
    reference_type, 
    details
  ) VALUES (
    p_user_id, 
    -p_amount, 
    p_transaction_type, 
    p_reference_id, 
    p_reference_type, 
    p_details
  ) RETURNING id INTO v_transaction_id;
  
  -- Return transaction details
  RETURN jsonb_build_object(
    'success', TRUE,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to request credit exchange
CREATE OR REPLACE FUNCTION public.request_credit_exchange(
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance INTEGER;
  v_cash_amount NUMERIC(10,2);
  v_exchange_rate NUMERIC(10,4);
  v_request_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get current balance
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Check if user has enough credits
  IF COALESCE(v_current_balance, 0) < p_amount THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Insufficient credits',
      'current_balance', v_current_balance,
      'requested_amount', p_amount
    );
  END IF;
  
  -- Get current exchange rate
  SELECT credits_to_cash_ratio INTO v_exchange_rate
  FROM public.exchange_rate_history
  WHERE effective_to IS NULL 
  ORDER BY effective_from DESC 
  LIMIT 1;
  
  -- Use default rate if none is set
  v_exchange_rate := COALESCE(v_exchange_rate, 0.01); -- Default: 0.01 USD per credit
  
  -- Calculate cash amount
  v_cash_amount := p_amount * v_exchange_rate;
  
  -- Create exchange request
  INSERT INTO public.credit_exchange_requests (
    user_id,
    credits_amount,
    cash_amount,
    status,
    payment_details
  ) VALUES (
    v_user_id,
    p_amount,
    v_cash_amount,
    'pending',
    jsonb_build_object(
      'exchange_rate', v_exchange_rate,
      'requested_at', now()
    )
  ) RETURNING id INTO v_request_id;
  
  -- Deduct credits (will be refunded if exchange is rejected)
  PERFORM public.use_user_credits(
    v_user_id, 
    p_amount, 
    'exchange_request', 
    v_request_id, 
    'credit_exchange', 
    jsonb_build_object(
      'cash_amount', v_cash_amount,
      'exchange_rate', v_exchange_rate
    )
  );
  
  -- Return request details
  RETURN jsonb_build_object(
    'success', TRUE,
    'request_id', v_request_id,
    'credits_amount', p_amount,
    'cash_amount', v_cash_amount,
    'exchange_rate', v_exchange_rate,
    'status', 'pending'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to get credit transaction history for a user
CREATE OR REPLACE FUNCTION public.get_credit_transaction_history(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_transaction_type TEXT DEFAULT NULL
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
  
  -- Count total matching transactions
  SELECT COUNT(*) INTO v_total
  FROM public.credit_transactions
  WHERE user_id = v_user_id
    AND (p_transaction_type IS NULL OR transaction_type = p_transaction_type);
  
  -- Get transactions
  WITH transactions AS (
    SELECT 
      id, 
      amount, 
      transaction_type, 
      reference_id, 
      reference_type, 
      created_at, 
      details
    FROM public.credit_transactions
    WHERE user_id = v_user_id
      AND (p_transaction_type IS NULL OR transaction_type = p_transaction_type)
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    jsonb_build_object(
      'total', v_total,
      'limit', p_limit,
      'offset', p_offset,
      'transactions', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'amount', t.amount,
          'transaction_type', t.transaction_type,
          'reference_id', t.reference_id,
          'reference_type', t.reference_type,
          'created_at', t.created_at,
          'details', t.details
        )
      ), '[]'::jsonb)
    ) INTO v_result
  FROM transactions t;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to get current exchange rate
CREATE OR REPLACE FUNCTION public.get_current_exchange_rate()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange_rate NUMERIC(10,4);
  v_effective_from TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current exchange rate
  SELECT 
    credits_to_cash_ratio, 
    effective_from 
  INTO 
    v_exchange_rate, 
    v_effective_from
  FROM public.exchange_rate_history
  WHERE effective_to IS NULL 
  ORDER BY effective_from DESC 
  LIMIT 1;
  
  -- Use default rate if none is set
  v_exchange_rate := COALESCE(v_exchange_rate, 0.01); -- Default: 0.01 USD per credit
  
  -- Return exchange rate details
  RETURN jsonb_build_object(
    'credits_to_cash_ratio', v_exchange_rate,
    'effective_from', v_effective_from,
    'min_exchange_amount', 100, -- Minimum 100 credits to exchange
    'max_exchange_amount', 10000 -- Maximum 10000 credits per exchange
  );
END;
$$;

-- Function for admin to process exchange requests
CREATE OR REPLACE FUNCTION public.admin_process_exchange_request(
  p_request_id UUID,
  p_approved BOOLEAN,
  p_admin_notes JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_credits_amount INTEGER;
  v_request_record public.credit_exchange_requests%ROWTYPE;
BEGIN
  -- Ensure user is admin
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_id AND is_admin = true) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Admin privileges required'
    );
  END IF;
  
  -- Get request details
  SELECT * INTO v_request_record
  FROM public.credit_exchange_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Exchange request not found'
    );
  END IF;
  
  IF v_request_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Request is not in pending status'
    );
  END IF;
  
  -- Update request status
  UPDATE public.credit_exchange_requests
  SET 
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    processed_at = now(),
    payment_details = v_request_record.payment_details || 
      jsonb_build_object(
        'processed_by', v_admin_id,
        'processed_at', now(),
        'admin_notes', p_admin_notes
      )
  WHERE id = p_request_id;
  
  -- If rejected, refund credits to user
  IF NOT p_approved THEN
    PERFORM public.add_user_credits(
      v_request_record.user_id,
      v_request_record.credits_amount,
      'exchange_refund',
      p_request_id,
      'credit_exchange_rejected',
      jsonb_build_object(
        'exchange_request_id', p_request_id,
        'refund_reason', 'Exchange request rejected',
        'admin_notes', p_admin_notes
      )
    );
  END IF;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', TRUE,
    'request_id', p_request_id,
    'status', CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    'processed_at', now(),
    'refunded', NOT p_approved
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Grant usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions to tables
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT SELECT, INSERT ON public.credit_exchange_requests TO authenticated;
GRANT SELECT ON public.exchange_rate_history TO authenticated;

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION public.get_credit_transaction_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_credit_exchange TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_exchange_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_process_exchange_request TO authenticated;

-- Add initial exchange rate (0.01 USD per credit)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.exchange_rate_history WHERE effective_to IS NULL) THEN
    INSERT INTO public.exchange_rate_history (credits_to_cash_ratio)
    VALUES (0.01);
  END IF;
END $$;

COMMIT; 