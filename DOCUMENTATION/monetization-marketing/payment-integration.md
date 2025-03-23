# MeetNow Payment Integration Guide

This document outlines the implementation plan for integrating payment processors with the MeetNow application to support credit purchases and subscription plans.

## Payment Processing Requirements

### Core Payment Functionality

1. **One-time Purchases**
   - Credit package purchases
   - Premium feature direct purchases

2. **Recurring Subscriptions**
   - Monthly subscription plans
   - Automatic renewal processing
   - Subscription management (upgrades, downgrades, cancellations)

3. **Transaction Records**
   - Purchase receipts
   - Payment history
   - Subscription status tracking

## Payment Processor Selection

Based on market research and requirements analysis, we recommend implementing:

### Primary Payment Processor: Stripe

**Advantages:**
- Comprehensive API for both one-time and subscription payments
- Strong developer documentation
- PCI compliance handling
- International payment support
- Mobile-optimized checkout
- Robust webhook system for event handling

**Integration Complexity:** Medium
**Cost Structure:** 2.9% + $0.30 per successful transaction

### Secondary Options:

#### PayPal
- Alternative payment method for users who prefer PayPal
- Widely recognized and trusted brand
- Can be added as a supplementary option

#### Apple Pay / Google Pay
- Streamlined mobile checkout experience
- Higher conversion rates on respective platforms
- Can be implemented through Stripe as the processor

## Database Schema Updates

### Payment Records Table

```sql
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method_type text NOT NULL,
  payment_processor text NOT NULL,
  processor_payment_id text NOT NULL,
  processor_customer_id text,
  status text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Add indices for efficient querying
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at);
```

### Customer Payment Methods

```sql
CREATE TABLE public.user_payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  processor text NOT NULL,
  processor_payment_method_id text NOT NULL,
  card_brand text,
  last_four text,
  expiry_month integer,
  expiry_year integer,
  is_default boolean NOT NULL DEFAULT false,
  billing_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Add indices for efficient querying
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
```

### Update to User Subscriptions Table

```sql
-- Add fields to support payment processor integration
ALTER TABLE public.user_subscriptions
ADD COLUMN processor_subscription_id text,
ADD COLUMN processor_customer_id text,
ADD COLUMN last_payment_transaction_id uuid REFERENCES public.payment_transactions(id);
```

## Backend Implementation

### 1. Stripe API Integration Setup

#### Environment Configuration

Add to `.env` file:
```
STRIPE_SECRET_KEY=sk_test_...  # Test key for development
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test key for frontend
STRIPE_WEBHOOK_SECRET=whsec_...  # For validating webhook authenticity
```

#### Dependency Installation

```bash
npm install stripe
```

#### Stripe Client Configuration

Create a Stripe service file at `src/services/stripe.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeService = {
  /**
   * Create or retrieve a Stripe customer for the user
   */
  async getOrCreateCustomer(userId, email, metadata = {}) {
    // Check if user already has a customer ID
    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    // If customer already exists, return it
    if (data && data.stripe_customer_id) {
      return await stripe.customers.retrieve(data.stripe_customer_id);
    }
    
    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        ...metadata
      }
    });
    
    // Save customer ID to user profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);
    
    return customer;
  },
  
  /**
   * Create a payment intent for one-time purchases
   */
  async createPaymentIntent(amount, currency, customerId, metadata = {}) {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency,
      customer: customerId,
      metadata
    });
  },
  
  /**
   * Create a subscription for the customer
   */
  async createSubscription(customerId, priceId, metadata = {}) {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata
    });
  },
  
  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId) {
    return await stripe.subscriptions.cancel(subscriptionId);
  },
  
  /**
   * Validate and process a webhook event
   */
  constructEventFromPayload(payload, signature) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }
};

module.exports = stripeService;
```

### 2. Supabase Serverless Function for Payment Processing

Create a new Supabase Edge Function at `supabase/functions/payment/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@11.12.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'POST') {
    // Handle individual routes
    const url = new URL(req.url)
    
    switch (url.pathname) {
      case '/payment/create-customer':
        return handleCreateCustomer(req)
      case '/payment/create-payment-intent':
        return handleCreatePaymentIntent(req)
      case '/payment/create-subscription':
        return handleCreateSubscription(req)
      case '/payment/cancel-subscription': 
        return handleCancelSubscription(req)
      case '/payment/webhook':
        return handleWebhook(req)
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
})

// Handler implementations...
async function handleCreateCustomer(req) {
  try {
    const { user_id, email } = await req.json()
    
    // Create a Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id }
    })
    
    // Store customer ID in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user_id)
    
    if (error) throw error
    
    return new Response(JSON.stringify({ customer_id: customer.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleCreatePaymentIntent(req) {
  try {
    const { amount, currency, customer_id, metadata } = await req.json()
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customer_id,
      metadata,
      automatic_payment_methods: { enabled: true }
    })
    
    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleCreateSubscription(req) {
  try {
    const { customer_id, price_id, metadata } = await req.json()
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [{ price: price_id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata
    })
    
    return new Response(JSON.stringify({
      subscription_id: subscription.id,
      client_secret: subscription.latest_invoice.payment_intent.client_secret
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleCancelSubscription(req) {
  try {
    const { subscription_id } = await req.json()
    
    // Cancel subscription
    const subscription = await stripe.subscriptions.cancel(subscription_id)
    
    return new Response(JSON.stringify({ subscription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleWebhook(req) {
  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    )
    
    // Process specific webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event)
        break
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Webhook event handlers
async function handlePaymentIntentSucceeded(event) {
  const paymentIntent = event.data.object
  const { user_id, credits, item_type } = paymentIntent.metadata
  
  if (item_type === 'credits' && credits) {
    // Add purchased credits to user account
    await supabase.rpc('add_user_credits', {
      user_id,
      credit_amount: parseInt(credits)
    })
  }
  
  // Record successful payment
  await supabase.from('payment_transactions').insert({
    user_id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    payment_method_type: paymentIntent.payment_method_type,
    payment_processor: 'stripe',
    processor_payment_id: paymentIntent.id,
    processor_customer_id: paymentIntent.customer,
    status: 'succeeded',
    description: `Payment for ${item_type}`,
    metadata: paymentIntent.metadata
  })
}

async function handleSubscriptionCreated(event) {
  const subscription = event.data.object
  const { user_id, plan_id } = subscription.metadata
  
  // Record subscription in our database
  await supabase.from('user_subscriptions').insert({
    user_id,
    plan_id,
    processor_subscription_id: subscription.id,
    processor_customer_id: subscription.customer,
    starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
    ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
    next_payment_date: new Date(subscription.current_period_end * 1000).toISOString(),
    status: subscription.status
  })
}

// Implement other webhook event handlers similarly...
```

### 3. Credit Purchase Processing Function

Create a database function to process credit purchases:

```sql
CREATE OR REPLACE FUNCTION public.process_credit_purchase(
  p_transaction_id uuid,
  p_user_id uuid,
  p_credits_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction record;
BEGIN
  -- Check if transaction exists and belongs to the user
  SELECT * INTO v_transaction
  FROM public.payment_transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;
  
  IF v_transaction IS NULL THEN
    RETURN false;
  END IF;
  
  -- Add credits to user's account
  PERFORM public.add_user_credits(p_user_id, p_credits_amount);
  
  -- Update transaction with related credit information
  UPDATE public.payment_transactions
  SET 
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{credits_added}',
      to_jsonb(p_credits_amount)
    ),
    updated_at = NOW()
  WHERE id = p_transaction_id;
  
  RETURN true;
END;
$$;
```

## Frontend Implementation

### 1. Stripe Elements Integration

First, install the Stripe React library:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

Create a Stripe provider in `src/providers/StripeProvider.jsx`:

```jsx
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StripeProvider = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
```

Update your app entry point to include the provider:

```jsx
// In src/App.jsx or equivalent
import StripeProvider from './providers/StripeProvider';

function App() {
  return (
    <StripeProvider>
      {/* rest of your app */}
    </StripeProvider>
  );
}
```

### 2. Payment Form Component

Create a reusable payment form at `src/components/payments/PaymentForm.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import supabase from '../../supabase';

const PaymentForm = ({ amount, currency = 'usd', metadata = {}, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  
  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData?.user) {
          throw new Error('User not authenticated');
        }
        
        // Get or create customer
        const customerResponse = await fetch('/api/payment/create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: userData.user.id,
            email: userData.user.email
          })
        });
        
        const { customer_id } = await customerResponse.json();
        
        // Create payment intent
        const response = await fetch('/api/payment/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency,
            customer_id,
            metadata: {
              user_id: userData.user.id,
              ...metadata
            }
          })
        });
        
        const { client_secret } = await response.json();
        setClientSecret(client_secret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setError(error.message);
      }
    };
    
    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency, metadata]);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setProcessing(true);
    
    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: metadata.name || 'MeetNow User',
          },
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Payment successful
        setPaymentMethod(paymentIntent.payment_method);
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-row">
        <label htmlFor="card-element">Credit or debit card</label>
        <CardElement
          id="card-element"
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="error-message text-red-500 mt-2">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={processing || !clientSecret || !stripe}
        className="btn-primary w-full mt-4 py-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}`}
      </button>
      
      {paymentMethod && (
        <div className="success-message text-green-500 mt-2">
          Payment successful!
        </div>
      )}
    </form>
  );
};

export default PaymentForm;
```

### 3. Update Credits Component

Modify the `src/components/Credits.jsx` to integrate with the payment system:

```jsx
// In src/components/Credits.jsx
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import PaymentForm from './payments/PaymentForm';

const Credits = ({ user, onCreditsUpdated }) => {
  // ... existing code ...
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  const creditPackages = [
    { credits: 120, price: 1.99 },
    { credits: 600, price: 8.99 },
    { credits: 1250, price: 15.99 },
    { credits: 6500, price: 69.99 }
  ];
  
  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentForm(true);
  };
  
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // The credits will be automatically added via webhook,
      // but we'll refresh the balance for the UI
      setMessage(`Successfully purchased ${selectedPackage.credits} credits!`);
      setShowPaymentForm(false);
      await fetchCredits();
      
      // Notify parent component if needed
      if (onCreditsUpdated) {
        onCreditsUpdated(credits + selectedPackage.credits);
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      setError('Failed to update credits. Please contact support.');
    }
  };
  
  // Modify the form to use our payment form for real payments
  return (
    <div className="credits-container p-4">
      {/* ... existing code ... */}
      
      <div className="credits-purchase bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold mb-3">Purchase More Credits</h3>
        
        {!showPaymentForm ? (
          <div className="credit-packages grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.credits}
                className="package-card p-4 border rounded cursor-pointer hover:border-blue-500"
                onClick={() => handlePurchaseClick(pkg)}
              >
                <h4 className="font-bold text-lg">{pkg.credits} Credits</h4>
                <p className="text-2xl font-bold">${pkg.price.toFixed(2)}</p>
                <button 
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="payment-container">
            <h4 className="font-bold text-lg mb-4">
              Purchase {selectedPackage.credits} Credits for ${selectedPackage.price.toFixed(2)}
            </h4>
            
            <PaymentForm 
              amount={selectedPackage.price}
              currency="usd"
              metadata={{
                user_id: user.id,
                credits: selectedPackage.credits,
                item_type: 'credits'
              }}
              onSuccess={handlePaymentSuccess}
              onError={(error) => setError(error.message)}
            />
            
            <button
              className="mt-4 text-gray-600 underline"
              onClick={() => setShowPaymentForm(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {/* ... existing code ... */}
    </div>
  );
};

export default Credits;
```

### 4. Update Subscription Component

Modify the Subscription component to use real payments:

```jsx
// In src/components/Subscription.jsx
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import PaymentForm from './payments/PaymentForm';

const Subscription = ({ user }) => {
  // ... existing state variables ...
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  
  // ... existing code ...
  
  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }
    
    // Get selected plan details from state
    const plan = plans.find(p => p.id === selectedPlan);
    
    try {
      setSubscribing(true);
      setError(null);
      setMessage(null);
      
      const { data: userData } = await supabase.auth.getUser();
      
      // Get or create customer
      const customerResponse = await fetch('/api/payment/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userData.user.id,
          email: userData.user.email
        })
      });
      
      const { customer_id } = await customerResponse.json();
      
      // Get Stripe price ID for the plan
      // This assumes you've stored Stripe price IDs in your subscription_plans table
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('stripe_price_id')
        .eq('id', selectedPlan)
        .single();
      
      if (planError) throw planError;
      
      // Create subscription
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id,
          price_id: planData.stripe_price_id,
          metadata: {
            user_id: userData.user.id,
            plan_id: selectedPlan
          }
        })
      });
      
      const { client_secret, subscription_id } = await response.json();
      
      // Set client secret for the payment form
      setClientSecret(client_secret);
      setShowPaymentForm(true);
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Failed to set up subscription. Please try again.');
      setSubscribing(false);
    }
  };
  
  const handlePaymentSuccess = async (paymentIntent) => {
    // The subscription will be activated via webhook,
    // but we'll refresh the subscription data for the UI
    setMessage('Successfully subscribed! Credits have been added to your account.');
    setShowPaymentForm(false);
    setSubscribing(false);
    await fetchSubscriptionData();
  };
  
  // ... existing code ...
  
  return (
    <div className="subscription-container p-4">
      {/* ... existing code ... */}
      
      {!userSubscription && !showPaymentForm && (
        <div className="subscription-selection bg-gray-50 p-4 rounded-lg mb-6">
          {/* Plan selection form as before */}
        </div>
      )}
      
      {showPaymentForm && (
        <div className="payment-container bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-3">Complete Subscription Payment</h3>
          <PaymentForm 
            clientSecret={clientSecret}
            onSuccess={handlePaymentSuccess}
            onError={(error) => {
              setError(error.message);
              setSubscribing(false);
              setShowPaymentForm(false);
            }}
          />
          
          <button
            className="mt-4 text-gray-600 underline"
            onClick={() => {
              setShowPaymentForm(false);
              setSubscribing(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* ... existing code ... */}
    </div>
  );
};

export default Subscription;
```

## Stripe Product Configuration

Before integration, set up the following products and prices in the Stripe dashboard:

### Credit Packages

1. Create a product called "MeetNow Credits"
2. Add price points:
   - 120 Credits: $1.99 (one-time)
   - 600 Credits: $8.99 (one-time)
   - 1250 Credits: $15.99 (one-time)
   - 6500 Credits: $69.99 (one-time)

### Subscription Plans

1. Create a product called "MeetNow Basic Subscription"
   - Add price: $3.99/month (recurring)

2. Create a product called "MeetNow Plus Subscription"
   - Add price: $19.99/month (recurring)

3. Create a product called "MeetNow Professional Subscription"
   - Add price: $49.99/month (recurring)

### Store Price IDs

After creating the products and prices in Stripe, update your subscription_plans table with the Stripe price IDs:

```sql
-- Add Stripe price ID column if it doesn't exist
ALTER TABLE public.subscription_plans 
ADD COLUMN stripe_price_id text;

-- Update each plan with its Stripe price ID
UPDATE public.subscription_plans
SET stripe_price_id = 'price_1234567890' -- replace with actual Stripe price ID
WHERE name = 'Basic';

UPDATE public.subscription_plans
SET stripe_price_id = 'price_0987654321' -- replace with actual Stripe price ID
WHERE name = 'Plus';

UPDATE public.subscription_plans
SET stripe_price_id = 'price_5432109876' -- replace with actual Stripe price ID
WHERE name = 'Professional';
```

## Testing

### Test Card Numbers

Use these test card numbers in development:

| Card Type | Number | Expiry | CVC | ZIP |
|-----------|--------|--------|-----|-----|
| Successful payment | 4242 4242 4242 4242 | Any future date | Any 3 digits | Any 5 digits |
| Requires authentication | 4000 0025 0000 3155 | Any future date | Any 3 digits | Any 5 digits |
| Declined payment | 4000 0000 0000 0002 | Any future date | Any 3 digits | Any 5 digits |

### Testing Checklist

1. **One-time Purchases**
   - Test successful credit package purchase
   - Verify credits are added to user account
   - Test payment authentication flow
   - Test failed payment handling

2. **Subscriptions**
   - Test subscription creation
   - Verify monthly credits are added
   - Test subscription cancellation
   - Test subscription renewal (use Stripe test clock)

3. **Webhook Handling**
   - Test payment_intent.succeeded event
   - Test subscription events
   - Test failed payment recovery

## Going to Production

### Steps for Production Deployment

1. **Update Stripe Keys**
   - Replace test keys with production keys
   - Update webhook endpoints

2. **Security Considerations**
   - Ensure all sensitive API calls are made server-side
   - Implement proper validation for all payment endpoints
   - Set up monitoring and alerts for payment failures

3. **Compliance**
   - Review and implement necessary legal documents:
     - Terms of Service
     - Privacy Policy
     - Refund Policy
   - Ensure compliance with local payment regulations

4. **Additional Payment Methods**
   - Consider adding Apple Pay and Google Pay
   - Add PayPal as an alternative payment method
   - Support local payment methods in target markets

5. **Operational Procedures**
   - Create process for handling disputes and chargebacks
   - Set up automated receipt generation
   - Implement customer support tools for payment issues 