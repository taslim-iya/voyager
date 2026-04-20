-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Organizations: users can see their own org
CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Admins can update own org" ON organizations
  FOR UPDATE USING (id IN (SELECT org_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Users: can see org members
CREATE POLICY "Users can view org members" ON users
  FOR SELECT USING (org_id IN (SELECT org_id FROM users u WHERE u.id = auth.uid()));
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')));
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (org_id IN (SELECT org_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Travel policies: org-scoped
CREATE POLICY "Users can view org policies" ON travel_policies
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Admins can manage policies" ON travel_policies
  FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Trips: org-scoped
CREATE POLICY "Users can view org trips" ON trips
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (user_id = auth.uid() OR org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'manager')));

-- Flight bookings: via trip org
CREATE POLICY "Users can view flight bookings" ON flight_bookings
  FOR SELECT USING (trip_id IN (SELECT id FROM trips WHERE org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "Users can create flight bookings" ON flight_bookings
  FOR INSERT WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Hotel bookings: via trip org
CREATE POLICY "Users can view hotel bookings" ON hotel_bookings
  FOR SELECT USING (trip_id IN (SELECT id FROM trips WHERE org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "Users can create hotel bookings" ON hotel_bookings
  FOR INSERT WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Approval requests: org-scoped
CREATE POLICY "Users can view org approvals" ON approval_requests
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can create approvals" ON approval_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Managers can update approvals" ON approval_requests
  FOR UPDATE USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'manager')));

-- Audit log: read-only, org-scoped
CREATE POLICY "Users can view org audit log" ON audit_log
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "System can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));
