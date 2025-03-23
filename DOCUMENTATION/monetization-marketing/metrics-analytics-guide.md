# MeetNow Metrics & Analytics Guide

This document outlines the key metrics and analytics approach for measuring the performance of MeetNow's monetization and marketing strategies.

## Monetization Metrics

### Core Financial Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **Average Revenue Per User (ARPU)** | Average revenue generated per active user | Total Revenue / Total Active Users | $3.99+ |
| **Monthly Recurring Revenue (MRR)** | Predictable monthly revenue from subscriptions | Sum of all active subscription values | $9,900+ by Q4 |
| **Customer Lifetime Value (CLV)** | Total expected revenue from a user | ARPU × Average User Lifespan | $25+ |
| **Customer Acquisition Cost (CAC)** | Cost to acquire a new user | Total Marketing Cost / New Users Acquired | $2-4 |
| **CLV:CAC Ratio** | Value of a customer vs. cost to acquire | CLV / CAC | 3:1+ |
| **Conversion Rate** | Percentage of users who make a purchase | Paying Users / Total Users × 100 | 8%+ |
| **Churn Rate** | Rate at which users stop using the app | Lost Users / Total Users at Start of Period × 100 | <5% monthly |

### Credit System Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **Average Credit Purchase** | Average amount of credits per purchase | Total Credits Purchased / Number of Purchases | 500+ |
| **Credit Usage Rate** | How quickly users spend their credits | Credits Spent / Credits Purchased × 100 | 75%+ monthly |
| **Credit Balance Distribution** | Number of users in different credit balance ranges | Count of users by credit balance segment | <25% with 0 balance |
| **Premium Feature Adoption** | Usage of premium features | Feature Purchases / Active Users × 100 | 10%+ |
| **Most Popular Features** | Premium features that generate most revenue | Credits spent by feature | Monitor for product decisions |

### Subscription Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **Subscription Rate** | Percentage of users with subscriptions | Subscribers / Active Users × 100 | 5%+ |
| **Subscription Renewal Rate** | Rate at which subscriptions are renewed | Renewals / Total Subscriptions Due for Renewal × 100 | 85%+ |
| **Plan Distribution** | Distribution of users across plans | Count of subscribers by plan | Even distribution |
| **Plan Upgrade Rate** | Users moving to higher plans | Upgrades / Total Subscribers × 100 | 10%+ quarterly |
| **Subscription Churn** | Rate of subscription cancellations | Cancellations / Total Subscribers × 100 | <7% monthly |

## User Engagement Metrics

### Acquisition Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **User Growth Rate** | Rate of new user acquisition | (New Users / Total Users at Start) × 100 | 15%+ monthly |
| **Acquisition Channels** | Source of new users | Users by referral source | Diversified sources |
| **Activation Rate** | Users who complete key actions | Activated Users / New Users × 100 | 70%+ |
| **Cost Per Install (CPI)** | Cost to get app installed | Ad Spend / Installs | $1.50 or less |
| **App Store Conversion** | Store page visitors who download | Downloads / Page Views × 100 | 30%+ |

### Activity Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **Daily Active Users (DAU)** | Users who engage with app daily | Count of unique daily users | 10K+ by Q4 |
| **Monthly Active Users (MAU)** | Users who engage with app monthly | Count of unique monthly users | 40K+ by Q4 |
| **Stickiness (DAU/MAU)** | Daily engagement as portion of monthly users | DAU / MAU | 25%+ |
| **Session Length** | Average time spent in app per session | Total Session Time / Number of Sessions | 5+ minutes |
| **Sessions Per User** | Average number of daily sessions | Total Sessions / DAU | 2.5+ |

### Meetup-Specific Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **Meetups Created** | Total meetups created per period | Count of new meetups | 2,000+ weekly |
| **Meetups Per User** | Average meetups created per user | Total Meetups / Creating Users | 1.5+ monthly |
| **Paid Meetup %** | Percentage of meetups using credits | Paid Meetups / Total Meetups × 100 | 25%+ |
| **Meetup Fill Rate** | How full meetups get compared to capacity | Actual Participants / Max Participants × 100 | 70%+ |
| **Meetup Geographic Density** | Meetups per geographic area | Meetups / km² | 5+ per km² in urban areas |

### Retention Metrics

| Metric | Description | Calculation | Target |
|--------|-------------|------------|--------|
| **Day 1 Retention** | Users who return 1 day after install | D1 Users / New Users × 100 | 60%+ |
| **Day 7 Retention** | Users who return 7 days after install | D7 Users / New Users × 100 | 30%+ |
| **Day 30 Retention** | Users who return 30 days after install | D30 Users / New Users × 100 | 15%+ |
| **User Lifespan** | Average duration of active usage | Sum of all user days / Number of users | 6+ months |
| **Reactivation Rate** | Dormant users who return to the app | Reactivated Users / Dormant Users × 100 | 5%+ monthly |

## Analytics Implementation

### Data Collection

#### Event Tracking
Implement comprehensive event tracking using the following framework:

```javascript
// Example event tracking function
const trackEvent = (eventName, properties = {}) => {
  // Add common properties
  const eventData = {
    ...properties,
    timestamp: new Date().toISOString(),
    userId: currentUser?.id,
    userType: currentUser?.isSubscriber ? 'subscriber' : 'free',
    appVersion: APP_VERSION,
    platform: getPlatform()
  };
  
  // Send to analytics service
  analyticsService.track(eventName, eventData);
  
  // Log to database if needed
  if (ENABLE_DB_LOGGING) {
    supabase.from('analytics_events').insert([eventData]);
  }
};
```

#### Key Events to Track

**User Events:**
- `user_signup` - New user registration
- `user_login` - User login
- `profile_update` - Profile information updated
- `app_open` - Application opened
- `app_background` - Application sent to background
- `location_permission` - Location permission granted/denied

**Monetization Events:**
- `credits_viewed` - Credits page viewed
- `credits_purchase_initiated` - Started credits purchase flow
- `credits_purchase_completed` - Completed credits purchase
- `credits_purchase_failed` - Failed credits purchase
- `subscription_viewed` - Subscription page viewed
- `subscription_started` - Subscription started
- `subscription_canceled` - Subscription canceled
- `premium_feature_viewed` - Premium feature page viewed
- `premium_feature_purchased` - Premium feature purchased

**Meetup Events:**
- `meetup_search` - Searched for meetups
- `meetup_viewed` - Viewed meetup details
- `meetup_created` - Created a meetup
- `meetup_joined` - Joined a meetup
- `meetup_left` - Left a meetup
- `meetup_shared` - Shared a meetup
- `meetup_extended` - Extended meetup duration (paid feature)
- `meetup_boosted` - Boosted meetup visibility (paid feature)

### Database Schema for Analytics

Create dedicated analytics tables for efficient reporting:

```sql
-- Daily metrics aggregation
CREATE TABLE public.daily_metrics (
  date date PRIMARY KEY,
  dau integer NOT NULL DEFAULT 0,
  new_users integer NOT NULL DEFAULT 0,
  meetups_created integer NOT NULL DEFAULT 0,
  paid_meetups_created integer NOT NULL DEFAULT 0,
  credits_purchased integer NOT NULL DEFAULT 0,
  revenue_usd numeric(10,2) NOT NULL DEFAULT 0,
  active_subscriptions integer NOT NULL DEFAULT 0,
  meetup_participations integer NOT NULL DEFAULT 0,
  premium_features_used integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User cohort tracking
CREATE TABLE public.user_cohorts (
  cohort_date date NOT NULL,
  days_since_signup integer NOT NULL,
  user_count integer NOT NULL DEFAULT 0,
  retention_rate numeric(5,2) NOT NULL,
  PRIMARY KEY (cohort_date, days_since_signup)
);

-- Feature usage analytics
CREATE TABLE public.feature_analytics (
  date date NOT NULL,
  feature_id uuid NOT NULL REFERENCES public.premium_features(id),
  purchases integer NOT NULL DEFAULT 0,
  credits_spent integer NOT NULL DEFAULT 0,
  unique_users integer NOT NULL DEFAULT 0,
  PRIMARY KEY (date, feature_id)
);

-- Geographic analytics for meetups
CREATE TABLE public.geo_analytics (
  date date NOT NULL,
  geo_hash varchar(12) NOT NULL,
  meetups_count integer NOT NULL DEFAULT 0,
  users_count integer NOT NULL DEFAULT 0,
  participation_rate numeric(5,2),
  PRIMARY KEY (date, geo_hash)
);
```

### Automated Reports

Set up automatic daily aggregation of key metrics using pg_cron:

```sql
-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics(target_date date DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the daily metrics record
  INSERT INTO public.daily_metrics (
    date,
    dau,
    new_users,
    meetups_created,
    paid_meetups_created,
    credits_purchased,
    revenue_usd,
    active_subscriptions,
    meetup_participations,
    premium_features_used
  )
  SELECT
    target_date,
    -- Daily active users
    (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE date(session_start) = target_date),
    -- New users
    (SELECT COUNT(*) FROM profiles WHERE date(created_at) = target_date),
    -- Meetups created
    (SELECT COUNT(*) FROM meetups WHERE date(created_at) = target_date),
    -- Paid meetups created
    (SELECT COUNT(*) FROM meetups WHERE date(created_at) = target_date AND is_free_meetup = false),
    -- Credits purchased
    (SELECT COALESCE(SUM(credit_amount), 0) FROM credits_history 
     WHERE date(changed_at) = target_date AND reason LIKE 'Credit purchase%'),
    -- Revenue (simplified - would need actual purchase records in production)
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE date(created_at) = target_date),
    -- Active subscriptions
    (SELECT COUNT(*) FROM user_subscriptions 
     WHERE status = 'active' AND target_date BETWEEN starts_at AND ends_at),
    -- Meetup participations
    (SELECT COUNT(*) FROM meetup_participants WHERE date(joined_at) = target_date),
    -- Premium features used
    (SELECT COUNT(*) FROM user_feature_purchases WHERE date(created_at) = target_date)
  ON CONFLICT (date) DO UPDATE SET
    dau = EXCLUDED.dau,
    new_users = EXCLUDED.new_users,
    meetups_created = EXCLUDED.meetups_created,
    paid_meetups_created = EXCLUDED.paid_meetups_created,
    credits_purchased = EXCLUDED.credits_purchased,
    revenue_usd = EXCLUDED.revenue_usd,
    active_subscriptions = EXCLUDED.active_subscriptions,
    meetup_participations = EXCLUDED.meetup_participations,
    premium_features_used = EXCLUDED.premium_features_used,
    updated_at = NOW();
    
  -- Add other aggregations for cohorts, feature usage, geo analytics etc.
  
  RAISE NOTICE 'Daily metrics aggregated for %', target_date;
END;
$$;

-- Schedule daily metrics aggregation to run at 4 AM
SELECT cron.schedule('0 4 * * *', $$SELECT public.aggregate_daily_metrics()$$);
```

## Data Visualization

### Real-time Dashboard

Implement a real-time admin dashboard with the following panels:

1. **Overview**: 
   - DAU/MAU trends
   - Revenue metrics
   - New user acquisition

2. **User Engagement**:
   - Retention cohorts heat map
   - Session metrics
   - Meetup creation/participation rates

3. **Monetization**:
   - Revenue breakdown by source
   - Credit purchase trends
   - Premium feature popularity

4. **Geographic**:
   - Heat map of meetup activity
   - City-by-city performance
   - User density mapping

### Admin API Endpoints

Create secure admin API endpoints for dashboard data:

```sql
-- Example function to get dashboard summary
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  days_back integer DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'period', json_build_object(
      'start_date', CURRENT_DATE - (days_back || ' days')::interval,
      'end_date', CURRENT_DATE
    ),
    'summary', json_build_object(
      'total_users', (SELECT COUNT(*) FROM profiles),
      'active_users', (SELECT COUNT(DISTINCT user_id) FROM user_sessions 
                      WHERE session_start > CURRENT_DATE - (days_back || ' days')::interval),
      'total_revenue', (SELECT COALESCE(SUM(revenue_usd), 0) FROM daily_metrics 
                       WHERE date > CURRENT_DATE - (days_back || ' days')::interval),
      'total_meetups', (SELECT COUNT(*) FROM meetups 
                       WHERE created_at > CURRENT_DATE - (days_back || ' days')::interval)
    ),
    'trends', json_build_object(
      'dau', (SELECT json_agg(json_build_object('date', date, 'value', dau))
              FROM daily_metrics 
              WHERE date > CURRENT_DATE - (days_back || ' days')::interval
              ORDER BY date),
      'revenue', (SELECT json_agg(json_build_object('date', date, 'value', revenue_usd))
                 FROM daily_metrics 
                 WHERE date > CURRENT_DATE - (days_back || ' days')::interval
                 ORDER BY date),
      'new_users', (SELECT json_agg(json_build_object('date', date, 'value', new_users))
                   FROM daily_metrics 
                   WHERE date > CURRENT_DATE - (days_back || ' days')::interval
                   ORDER BY date)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

## A/B Testing Framework

### Test Implementation

Implement a system for running A/B tests on monetization features:

```sql
-- A/B test configuration table
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  variants jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User test assignments
CREATE TABLE public.user_test_assignments (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  test_id uuid NOT NULL REFERENCES public.ab_tests(id),
  variant text NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, test_id)
);

-- Test conversion events
CREATE TABLE public.test_conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  test_id uuid NOT NULL REFERENCES public.ab_tests(id),
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_test_conversion_test_id ON public.test_conversion_events(test_id);
CREATE INDEX idx_test_conversion_user_id ON public.test_conversion_events(user_id);
```

### Example A/B Tests

1. **Credit Package Test**:
   - Variant A: Current credit packages
   - Variant B: Enhanced value packages (+20% more credits)
   - Metric: Conversion rate and average purchase value

2. **Subscription Pricing Test**:
   - Variant A: Current monthly pricing
   - Variant B: Annual pricing with 20% discount
   - Metric: Subscription adoption rate and CLV

3. **Feature Promotion Test**:
   - Variant A: Standard feature cards
   - Variant B: Enhanced visual design with social proof
   - Metric: Feature purchase rate

## Implementation Plan

### Phase 1: Core Analytics (Week 1-2)
1. Set up event tracking framework
2. Create analytics tables
3. Implement daily aggregation functions
4. Build basic admin API endpoints

### Phase 2: Dashboard (Week 3-4)
1. Develop admin dashboard UI
2. Implement real-time metrics
3. Create visualization components
4. Add export functionality

### Phase 3: A/B Testing (Week 5-6)
1. Implement A/B testing framework
2. Set up first test (credit packages)
3. Create test reporting interface
4. Document test management procedures

### Phase 4: Optimization (Week 7-8)
1. Analyze initial data
2. Optimize key metrics
3. Implement automated alerts
4. Document insights and action plan 