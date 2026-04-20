CREATE TABLE travel_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Policy',
  rules JSONB NOT NULL DEFAULT '{"max_flight_price":500,"cabin_class":["economy"],"advance_booking_days":7,"hotel_nightly_cap":200,"requires_approval_above":1000,"allowed_airlines":[],"blacklisted_destinations":[]}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_policies_org ON travel_policies(org_id);
