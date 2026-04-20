CREATE TABLE hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mock',
  provider_ref TEXT,
  hotel_name TEXT NOT NULL,
  address TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  room_type TEXT,
  nightly_rate NUMERIC(12,2),
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled')),
  booked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hotel_trip ON hotel_bookings(trip_id);
