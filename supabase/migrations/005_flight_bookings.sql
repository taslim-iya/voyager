CREATE TABLE flight_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  duffel_offer_id TEXT,
  duffel_order_id TEXT,
  pnr TEXT,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  booking_method TEXT NOT NULL CHECK (booking_method IN ('duffel','deeplink','ea_request')),
  deeplink_url TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','ticketed','cancelled')),
  booked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_flight_trip ON flight_bookings(trip_id);
