CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  billing_status TEXT NOT NULL DEFAULT 'trial' CHECK (billing_status IN ('trial','active','past_due','cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  policy_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
