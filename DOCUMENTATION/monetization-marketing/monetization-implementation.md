# MeetNow Monetization Technical Implementation Guide

This document provides technical specifications for implementing the enhanced monetization features outlined in the monetization strategy.

## Database Schema Updates

### New Tables

#### 1. Subscription Plans

```sql
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  monthly_credits integer NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Initial subscription plans
INSERT INTO public.subscription_plans (name, description, monthly_credits, price_usd)
VALUES 
  ('Basic', 'Entry level subscription with 250 monthly credits', 250, 3.99),
  ('Plus', 'Popular plan with 1500 monthly credits', 1500, 19.99),
  ('Professional', 'Premium plan with 5000 monthly credits', 5000, 49.99);
```

#### 2. User Subscriptions

```sql
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  is_auto_renew boolean NOT NULL DEFAULT true,
  last_payment_date timestamp with time zone NOT NULL DEFAULT now(),
  next_payment_date timestamp with time zone NOT NULL,
  payment_method_id text,
  status text NOT NULL DEFAULT 'active',
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Index for user lookup
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
```

#### 3. Premium Features

```sql
CREATE TABLE public.premium_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  credits_cost integer NOT NULL,
  feature_type text NOT NULL,
  duration_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Initial premium features
INSERT INTO public.premium_features (name, description, credits_cost, feature_type, duration_minutes)
VALUES 
  ('Meetup Boost - 1 Hour', 'Increase your meetup visibility for 1 hour', 25, 'boost', 60),
  ('Meetup Boost - 4 Hours', 'Increase your meetup visibility for 4 hours', 75, 'boost', 240),
  ('Meetup Boost - 24 Hours', 'Increase your meetup visibility for 24 hours', 150, 'boost', 1440),
  ('Custom Color Theme', 'Customize your meetup with a color theme', 20, 'customization', NULL),
  ('Custom Meetup Banner', 'Add a custom banner to your meetup', 50, 'customization', NULL);
```

#### 4. User Feature Purchases

```sql
CREATE TABLE public.user_feature_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meetup_id uuid REFERENCES public.meetups(id),
  feature_id uuid NOT NULL REFERENCES public.premium_features(id),
  credits_spent integer NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Indexes for common queries
CREATE INDEX idx_user_feature_purchases_user_id ON public.user_feature_purchases(user_id);
CREATE INDEX idx_user_feature_purchases_meetup_id ON public.user_feature_purchases(meetup_id);
```

### Schema Modifications

#### 1. Update Credits Package Pricing in Credits Component

Modify the `purchaseAmount` options and pricing in `src/components/Credits.jsx`:

```javascript
<select
  id="purchaseAmount"
  value={purchaseAmount}
  onChange={(e) => setPurchaseAmount(Number(e.target.value))}
  className="w-full p-2 border rounded"
>
  <option value={120}>120 Credits ($1.99)</option>
  <option value={600}>600 Credits ($8.99)</option>
  <option value={1250}>1250 Credits ($15.99)</option>
  <option value={6500}>6500 Credits ($69.99)</option>
</select>
```

## Database Functions

### 1. Subscription Management Functions

```sql
-- Function to add a subscription to a user
CREATE OR REPLACE FUNCTION public.subscribe_user(
  p_user_id uuid,
  p_plan_id uuid,
  p_payment_method_id text,
  p_months integer DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date timestamp with time zone := now();
  v_end_date timestamp with time zone := v_start_date + (p_months || ' months')::interval;
  v_next_payment_date timestamp with time zone := v_start_date + ('1 month')::interval;
  v_subscription_id uuid;
  v_credits_to_add integer;
BEGIN
  -- Get how many credits to add based on plan
  SELECT monthly_credits INTO v_credits_to_add
  FROM public.subscription_plans
  WHERE id = p_plan_id;
  
  -- Create subscription record
  INSERT INTO public.user_subscriptions (
    user_id, 
    plan_id, 
    starts_at, 
    ends_at, 
    payment_method_id,
    next_payment_date
  )
  VALUES (
    p_user_id,
    p_plan_id,
    v_start_date,
    v_end_date,
    p_payment_method_id,
    v_next_payment_date
  )
  RETURNING id INTO v_subscription_id;
  
  -- Add subscription credits to user
  PERFORM public.add_user_credits(p_user_id, v_credits_to_add);
  
  RETURN v_subscription_id;
END;
$$;

-- Function to process subscription renewal
CREATE OR REPLACE FUNCTION public.process_subscription_renewal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription record;
  v_credits_to_add integer;
BEGIN
  -- Find subscriptions due for renewal
  FOR v_subscription IN 
    SELECT us.id, us.user_id, us.plan_id, us.next_payment_date, sp.monthly_credits
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE 
      us.is_auto_renew = true 
      AND us.status = 'active'
      AND us.next_payment_date <= now()
  LOOP
    -- In a real implementation, this would integrate with payment processor
    -- For now, we'll simulate successful payment
    
    -- Update subscription
    UPDATE public.user_subscriptions
    SET 
      last_payment_date = now(),
      next_payment_date = now() + '1 month'::interval,
      ends_at = ends_at + '1 month'::interval
    WHERE id = v_subscription.id;
    
    -- Add credits to user
    PERFORM public.add_user_credits(v_subscription.user_id, v_subscription.monthly_credits);
    
  END LOOP;
END;
$$;

-- Function to cancel a subscription
CREATE OR REPLACE FUNCTION public.cancel_user_subscription(
  p_user_id uuid,
  p_subscription_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_exists boolean;
BEGIN
  -- Check if subscription exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM public.user_subscriptions 
    WHERE id = p_subscription_id AND user_id = p_user_id
  ) INTO v_subscription_exists;
  
  IF NOT v_subscription_exists THEN
    RETURN false;
  END IF;
  
  -- Update subscription
  UPDATE public.user_subscriptions
  SET 
    is_auto_renew = false,
    status = 'canceled',
    canceled_at = now()
  WHERE id = p_subscription_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;
```

### 2. Premium Feature Functions

```sql
-- Function to purchase a premium feature for a meetup
CREATE OR REPLACE FUNCTION public.purchase_premium_feature(
  p_user_id uuid,
  p_meetup_id uuid,
  p_feature_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feature record;
  v_user_credits integer;
  v_expire_time timestamp with time zone;
  v_purchase_id uuid;
BEGIN
  -- Get feature details
  SELECT feature_type, credits_cost, duration_minutes 
  INTO v_feature
  FROM public.premium_features
  WHERE id = p_feature_id;
  
  -- Get user credits
  SELECT credits INTO v_user_credits
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if user has enough credits
  IF v_user_credits < v_feature.credits_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Calculate expiration time if applicable
  IF v_feature.duration_minutes IS NOT NULL THEN
    v_expire_time := now() + (v_feature.duration_minutes || ' minutes')::interval;
  ELSE
    v_expire_time := NULL;
  END IF;
  
  -- Deduct credits
  UPDATE public.profiles
  SET credits = credits - v_feature.credits_cost
  WHERE id = p_user_id;
  
  -- Record purchase
  INSERT INTO public.user_feature_purchases (
    user_id,
    meetup_id,
    feature_id,
    credits_spent,
    expires_at
  )
  VALUES (
    p_user_id,
    p_meetup_id,
    p_feature_id,
    v_feature.credits_cost,
    v_expire_time
  )
  RETURNING id INTO v_purchase_id;
  
  -- Add record to credit history
  INSERT INTO public.credits_history (
    user_id,
    previous_balance,
    new_balance,
    reason
  )
  VALUES (
    p_user_id,
    v_user_credits,
    v_user_credits - v_feature.credits_cost,
    'Premium feature purchase: ' || v_feature.feature_type
  );
  
  RETURN v_purchase_id;
END;
$$;

-- Function to check active premium features for a meetup
CREATE OR REPLACE FUNCTION public.get_meetup_active_features(
  p_meetup_id uuid
)
RETURNS TABLE (
  feature_id uuid,
  feature_name text,
  feature_type text,
  expires_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    pf.id as feature_id,
    pf.name as feature_name,
    pf.feature_type,
    ufp.expires_at
  FROM 
    public.user_feature_purchases ufp
    JOIN public.premium_features pf ON ufp.feature_id = pf.id
  WHERE 
    ufp.meetup_id = p_meetup_id
    AND ufp.is_active = true
    AND (ufp.expires_at IS NULL OR ufp.expires_at > now())
  ORDER BY 
    pf.feature_type, ufp.expires_at DESC;
$$;
```

### 3. Update Existing Functions

```sql
-- Update the create_meetup function to support premium features
CREATE OR REPLACE FUNCTION public.create_meetup_with_premium(
  p_title text,
  p_description text,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_image_url text,
  p_user_id uuid,
  p_duration_minutes integer DEFAULT 60,
  p_premium_features uuid[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meetup_id uuid;
  v_feature_id uuid;
  v_required_credits integer;
  v_total_required_credits integer := 0;
BEGIN
  -- Calculate required credits for the duration
  SELECT calculate_required_credits(p_duration_minutes) INTO v_required_credits;
  v_total_required_credits := v_total_required_credits + v_required_credits;
  
  -- Calculate additional credits for premium features
  IF p_premium_features IS NOT NULL THEN
    FOR i IN 1..array_length(p_premium_features, 1)
    LOOP
      v_feature_id := p_premium_features[i];
      
      -- Add feature cost to total
      SELECT v_total_required_credits + credits_cost 
      INTO v_total_required_credits
      FROM public.premium_features
      WHERE id = v_feature_id;
    END LOOP;
  END IF;
  
  -- Check if user has enough credits
  PERFORM public.use_credits_for_meetup(p_user_id, v_total_required_credits);
  
  -- Create the meetup
  INSERT INTO public.meetups (
    title,
    description,
    address,
    location,
    image_url,
    user_id,
    starts_at,
    duration_minutes,
    is_free_meetup
  )
  VALUES (
    p_title,
    p_description,
    p_address,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_image_url,
    p_user_id,
    now(),
    p_duration_minutes,
    p_duration_minutes <= 60 AND p_premium_features IS NULL
  )
  RETURNING id INTO v_meetup_id;
  
  -- Apply premium features if any
  IF p_premium_features IS NOT NULL THEN
    FOR i IN 1..array_length(p_premium_features, 1)
    LOOP
      v_feature_id := p_premium_features[i];
      
      -- Record feature purchase (but don't deduct credits again)
      INSERT INTO public.user_feature_purchases (
        user_id,
        meetup_id,
        feature_id,
        credits_spent,
        expires_at
      )
      SELECT 
        p_user_id,
        v_meetup_id,
        pf.id,
        0, -- No additional credits (already accounted for in total)
        CASE 
          WHEN pf.duration_minutes IS NOT NULL THEN 
            now() + (pf.duration_minutes || ' minutes')::interval
          ELSE NULL
        END
      FROM public.premium_features pf
      WHERE pf.id = v_feature_id;
      
    END LOOP;
  END IF;
  
  RETURN v_meetup_id;
END;
$$;
```

## Frontend Implementation

### 1. Subscription Management Component

Create a new component at `src/components/Subscription.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

const Subscription = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });
      
      if (plansError) throw plansError;
      setPlans(plansData || []);
      
      // Fetch user's active subscription if any
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (subError && subError.code !== 'PGRST116') throw subError;
      setUserSubscription(subData || null);
      
      // Set default selected plan (first one)
      if (plansData && plansData.length > 0) {
        setSelectedPlan(plansData[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }
    
    try {
      setSubscribing(true);
      setError(null);
      setMessage(null);
      
      // In a real app, you would collect payment info here
      const paymentMethodId = 'pm_simulated_' + Math.random().toString(36).substr(2, 9);
      
      // Call the subscribe function
      const { data, error } = await supabase.rpc('subscribe_user', {
        p_user_id: user.id,
        p_plan_id: selectedPlan,
        p_payment_method_id: paymentMethodId,
        p_months: 1
      });
      
      if (error) throw error;
      
      // Refresh subscription data
      await fetchSubscriptionData();
      
      setMessage('Successfully subscribed! Credits have been added to your account.');
      
    } catch (error) {
      console.error('Error subscribing:', error);
      setError('Failed to complete subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription) return;
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const { data, error } = await supabase.rpc('cancel_user_subscription', {
        p_user_id: user.id,
        p_subscription_id: userSubscription.id
      });
      
      if (error) throw error;
      
      // Refresh subscription data
      await fetchSubscriptionData();
      
      setMessage('Subscription successfully canceled. Your benefits will continue until the end of the billing period.');
      
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading subscription information...</div>;
  }

  return (
    <div className="subscription-container p-4">
      <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
      
      {error && <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {message && <div className="success-message bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      
      {userSubscription ? (
        <div className="current-subscription bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-2">Current Subscription</h3>
          <p className="mb-2"><strong>Plan:</strong> {userSubscription.subscription_plans.name}</p>
          <p className="mb-2"><strong>Monthly Credits:</strong> {userSubscription.subscription_plans.monthly_credits}</p>
          <p className="mb-2"><strong>Price:</strong> ${userSubscription.subscription_plans.price_usd.toFixed(2)}/month</p>
          <p className="mb-2"><strong>Next Renewal:</strong> {new Date(userSubscription.next_payment_date).toLocaleDateString()}</p>
          
          <button 
            onClick={handleCancelSubscription}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cancel Subscription
          </button>
        </div>
      ) : (
        <div className="subscription-selection bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-3">Select a Subscription Plan</h3>
          <form onSubmit={handleSubscribe}>
            <div className="plans-container grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  className={`plan-card p-4 rounded border-2 cursor-pointer ${selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
                  <p className="text-gray-600 mb-2">{plan.description}</p>
                  <p className="font-bold text-xl mb-2">${plan.price_usd.toFixed(2)}/month</p>
                  <p className="font-semibold">{plan.monthly_credits} credits monthly</p>
                </div>
              ))}
            </div>
            
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
              disabled={subscribing || !selectedPlan}
            >
              {subscribing ? 'Processing...' : 'Subscribe Now'}
            </button>
          </form>
        </div>
      )}
      
      <div className="subscription-benefits bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-3">Subscription Benefits</h3>
        <ul className="list-disc pl-5">
          <li><strong>Monthly Credits:</strong> Automatically receive credits every month</li>
          <li><strong>Better Value:</strong> Get up to 40% more credits compared to one-time purchases</li>
          <li><strong>Convenience:</strong> Never worry about running out of credits</li>
          <li><strong>Cancel Anytime:</strong> No long-term commitment required</li>
        </ul>
      </div>
    </div>
  );
};

export default Subscription;
```

### 2. Premium Features Component

Create a new component at `src/components/PremiumFeatures.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

const PremiumFeatures = ({ user, meetupId, onFeatureApplied }) => {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [features, setFeatures] = useState([]);
  const [activeFeatures, setActiveFeatures] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user && meetupId) {
      fetchData();
    }
  }, [user, meetupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available premium features
      const { data: featuresData, error: featuresError } = await supabase
        .from('premium_features')
        .select('*')
        .eq('is_active', true)
        .order('credits_cost', { ascending: true });
      
      if (featuresError) throw featuresError;
      setFeatures(featuresData || []);
      
      // Fetch user credits
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      setUserCredits(userData.credits || 0);
      
      // Fetch active features for this meetup
      const { data: activeData, error: activeError } = await supabase.rpc(
        'get_meetup_active_features',
        { p_meetup_id: meetupId }
      );
      
      if (activeError) throw activeError;
      setActiveFeatures(activeData || []);
      
    } catch (error) {
      console.error('Error fetching premium features data:', error);
      setError('Failed to load premium features. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFeature = async () => {
    if (!selectedFeature) {
      setError('Please select a feature to apply');
      return;
    }
    
    // Find selected feature data
    const feature = features.find(f => f.id === selectedFeature);
    if (!feature) return;
    
    // Check if user has enough credits
    if (userCredits < feature.credits_cost) {
      setError(`You need ${feature.credits_cost} credits to apply this feature. You have ${userCredits} credits.`);
      return;
    }
    
    try {
      setApplying(true);
      setError(null);
      setMessage(null);
      
      // Purchase premium feature
      const { data, error } = await supabase.rpc('purchase_premium_feature', {
        p_user_id: user.id,
        p_meetup_id: meetupId,
        p_feature_id: selectedFeature
      });
      
      if (error) throw error;
      
      // Refresh data
      await fetchData();
      
      // Notify parent component
      if (onFeatureApplied) {
        onFeatureApplied(feature);
      }
      
      setMessage(`Successfully applied the "${feature.name}" feature!`);
      setSelectedFeature(null);
      
    } catch (error) {
      console.error('Error applying feature:', error);
      setError('Failed to apply premium feature. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading premium features...</div>;
  }

  return (
    <div className="premium-features-container p-4">
      <h2 className="text-2xl font-bold mb-4">Premium Features</h2>
      
      {error && <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {message && <div className="success-message bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      
      <div className="credits-info bg-blue-50 p-3 rounded-lg mb-4">
        <p className="font-medium">Your Credits: <span className="font-bold">{userCredits}</span></p>
      </div>
      
      {activeFeatures.length > 0 && (
        <div className="active-features bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-2">Active Features</h3>
          <ul className="divide-y divide-purple-100">
            {activeFeatures.map(feature => (
              <li key={feature.feature_id} className="py-2">
                <div className="font-semibold">{feature.feature_name}</div>
                {feature.expires_at && (
                  <div className="text-sm text-gray-600">
                    Expires: {new Date(feature.expires_at).toLocaleString()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="available-features bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold mb-3">Available Features</h3>
        
        <div className="features-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {features.map(feature => (
            <div 
              key={feature.id}
              className={`feature-card p-4 rounded border-2 cursor-pointer ${selectedFeature === feature.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedFeature(feature.id)}
            >
              <h4 className="text-lg font-bold mb-2">{feature.name}</h4>
              <p className="text-gray-600 mb-2">{feature.description}</p>
              <p className="font-bold">
                {feature.credits_cost} credits
                {userCredits < feature.credits_cost && (
                  <span className="text-red-500 text-sm ml-2">(insufficient credits)</span>
                )}
              </p>
              {feature.duration_minutes && (
                <p className="text-sm text-gray-600">
                  Duration: {feature.duration_minutes / 60} hour{feature.duration_minutes / 60 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
        
        <button 
          onClick={handleApplyFeature}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          disabled={applying || !selectedFeature}
        >
          {applying ? 'Applying...' : 'Apply Selected Feature'}
        </button>
      </div>
      
      <div className="feature-info bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-3">About Premium Features</h3>
        <p className="mb-3">
          Enhance your meetup with premium features to increase visibility and engagement. 
          Premium features are applied immediately upon purchase and will remain active for their duration.
        </p>
        <ul className="list-disc pl-5">
          <li><strong>Boost Visibility:</strong> Make your meetup appear higher in search results</li>
          <li><strong>Custom Appearance:</strong> Stand out with unique colors and banners</li>
          <li><strong>More Coming Soon:</strong> We're constantly adding new premium features</li>
        </ul>
      </div>
    </div>
  );
};

export default PremiumFeatures;
```

## Integration Points

### 1. Update App Routes

Integrate the new components into the main application routing:

```jsx
// In your main routing component
import Subscription from './components/Subscription';
import PremiumFeatures from './components/PremiumFeatures';

// Then in your route definitions:
<Route path="/subscription" element={<Subscription user={currentUser} />} />
<Route path="/meetup/:id/premium" element={<PremiumFeatures user={currentUser} meetupId={meetupId} onFeatureApplied={handleFeatureApplied} />} />
```

### 2. Add Navigation Links

Add links to the new features in your navigation menu:

```jsx
<li>
  <Link to="/subscription" className="nav-link">
    <span className="icon"><SubscriptionIcon /></span>
    <span>Subscription</span>
  </Link>
</li>
```

### 3. Add Premium Features Button to Meetup Detail View

```jsx
{userOwnsThisMeetup && (
  <Link 
    to={`/meetup/${meetup.id}/premium`}
    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
  >
    Enhance This Meetup
  </Link>
)}
```

## Scheduled Tasks

### 1. Subscription Auto-Renewal Task

Schedule a daily task to process subscription renewals:

```sql
-- Schedule subscription renewal to run daily at 1 AM
SELECT cron.schedule('0 1 * * *', $$SELECT public.process_subscription_renewal()$$);
```

### 2. Premium Feature Expiry Check

Create and schedule a task to deactivate expired premium features:

```sql
-- Function to deactivate expired premium features
CREATE OR REPLACE FUNCTION public.deactivate_expired_features()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_feature_purchases
  SET is_active = false
  WHERE 
    is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  RAISE NOTICE 'Deactivated expired premium features at %', NOW();
END;
$$;

-- Schedule feature expiry check to run every hour
SELECT cron.schedule('0 * * * *', $$SELECT public.deactivate_expired_features()$$);
```

## Testing

1. Test credit package updates by verifying displayed prices in the Credits component
2. Test subscription creation and cancellation processes
3. Test premium feature application to meetups
4. Verify credit deduction for each feature purchase
5. Test feature expiration by setting short durations

## Future Enhancements

1. Payment processor integration (Stripe, PayPal)
2. Receipt generation for purchases
3. Credit subscription auto-renewal notifications
4. Promotional discount codes
5. Bundle discounts for multiple feature purchases 