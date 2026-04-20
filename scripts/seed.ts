import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding Voyager database...');

  // 1. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .upsert({ name: 'Acme Corp', slug: 'acme-corp', billing_status: 'trial' }, { onConflict: 'slug' })
    .select()
    .single();

  if (orgError) { console.error('Org error:', orgError); return; }
  console.log('✅ Organization:', org.name);

  // 2. Create auth users
  const users = [
    { email: 'admin@acme.test', password: 'password123', name: 'Alice Admin', role: 'admin', department: 'Operations' },
    { email: 'manager@acme.test', password: 'password123', name: 'Bob Manager', role: 'manager', department: 'Sales' },
    { email: 'traveler@acme.test', password: 'password123', name: 'Charlie Traveler', role: 'traveler', department: 'Engineering' },
  ];

  for (const u of users) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (authError && !authError.message.includes('already')) {
      console.error(`Auth error for ${u.email}:`, authError.message);
      continue;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      // Try to find existing
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find(x => x.email === u.email);
      if (!found) { console.error(`Cannot find user ${u.email}`); continue; }

      await supabase.from('users').upsert({
        id: found.id, org_id: org.id, email: u.email, full_name: u.name, role: u.role, department: u.department, budget_remaining: 5000,
      }, { onConflict: 'id' });

      console.log(`✅ User (existing): ${u.name} (${u.role})`);
      continue;
    }

    await supabase.from('users').upsert({
      id: userId, org_id: org.id, email: u.email, full_name: u.name, role: u.role, department: u.department, budget_remaining: 5000,
    }, { onConflict: 'id' });

    console.log(`✅ User: ${u.name} (${u.role})`);
  }

  // 3. Create default policy
  const { error: policyError } = await supabase.from('travel_policies').upsert({
    org_id: org.id,
    name: 'Default Policy',
    is_default: true,
    rules: {
      max_flight_price: 500,
      cabin_class: ['economy', 'premium_economy'],
      advance_booking_days: 7,
      hotel_nightly_cap: 200,
      requires_approval_above: 1000,
      allowed_airlines: [],
      blacklisted_destinations: ['North Korea', 'Syria'],
    },
  }, { onConflict: 'org_id' });

  if (policyError) console.error('Policy error:', policyError);
  else console.log('✅ Travel policy created');

  // 4. Get user IDs
  const { data: dbUsers } = await supabase.from('users').select('id, email').eq('org_id', org.id);
  const traveler = dbUsers?.find(u => u.email === 'traveler@acme.test');
  const manager = dbUsers?.find(u => u.email === 'manager@acme.test');

  if (traveler) {
    // 5. Create sample trips
    const { data: trip1 } = await supabase.from('trips').insert({
      user_id: traveler.id, org_id: org.id,
      title: 'Client meeting in New York', status: 'booked',
      purpose: 'Q1 review with Acme NYC office', destination: 'New York',
      start_date: '2026-05-15', end_date: '2026-05-18',
      total_cost: 890, currency: 'GBP',
    }).select().single();

    if (trip1) {
      await supabase.from('flight_bookings').insert({
        trip_id: trip1.id,
        pnr: 'VYG1A2B3C', booking_method: 'duffel', status: 'confirmed',
        total_amount: 450, currency: 'GBP',
        segments: [{ origin: 'LHR', destination: 'JFK', departure: '2026-05-15T08:00:00Z', arrival: '2026-05-15T11:30:00Z', carrier: 'British Airways', flightNumber: 'BA117', cabin: 'economy', duration: 450 }],
      });
      await supabase.from('hotel_bookings').insert({
        trip_id: trip1.id, provider: 'mock', hotel_name: 'Marriott Midtown NYC',
        check_in: '2026-05-15', check_out: '2026-05-18', room_type: 'Standard Room',
        nightly_rate: 146.67, total_amount: 440, currency: 'GBP', status: 'confirmed',
      });
      console.log('✅ Trip 1: Client meeting (booked)');
    }

    const { data: trip2 } = await supabase.from('trips').insert({
      user_id: traveler.id, org_id: org.id,
      title: 'Conference in Berlin', status: 'pending_approval',
      purpose: 'TechConf 2026 speaker slot', destination: 'Berlin',
      start_date: '2026-06-10', end_date: '2026-06-13',
      total_cost: 1250, currency: 'GBP',
      justification: 'Speaking slot at TechConf — high visibility for the company',
    }).select().single();

    if (trip2) {
      await supabase.from('flight_bookings').insert({
        trip_id: trip2.id, booking_method: 'ea_request', status: 'pending',
        total_amount: 750, currency: 'GBP',
        segments: [{ origin: 'LHR', destination: 'BER', departure: '2026-06-10T07:00:00Z', arrival: '2026-06-10T09:30:00Z', carrier: 'Lufthansa', flightNumber: 'LH903', cabin: 'business', duration: 150 }],
      });
      await supabase.from('approval_requests').insert({
        trip_id: trip2.id, org_id: org.id,
        requester_id: traveler.id, status: 'pending',
        policy_violations: [
          { rule: 'cabin_class', message: 'Business class not in policy', severity: 'warning' },
          { rule: 'requires_approval_above', message: 'Trip cost exceeds £1,000 approval threshold', severity: 'warning' },
        ],
      });
      console.log('✅ Trip 2: Conference (pending approval)');
    }
  }

  // 6. Audit log entry
  await supabase.from('audit_log').insert({
    org_id: org.id,
    action: 'seed_completed',
    entity_type: 'system',
    metadata: { seeded_at: new Date().toISOString(), version: '1.0' },
  });

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('  admin@acme.test / password123');
  console.log('  manager@acme.test / password123');
  console.log('  traveler@acme.test / password123');
}

seed().catch(console.error);
