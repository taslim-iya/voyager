import { NextResponse } from 'next/server';
import { mockHotelProvider } from '@/lib/hotels/mock-provider';
import { checkHotelPolicy, parseRules } from '@/lib/policy/engine';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '1');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  // Get policy
  let policyRules = parseRules({});
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (profile) {
        const { data: policy } = await supabase.from('travel_policies').select('rules').eq('org_id', profile.org_id).eq('is_default', true).single();
        if (policy) policyRules = parseRules(policy.rules);
      }
    }
  } catch {}

  const hotels = await mockHotelProvider.search({ destination, checkIn, checkOut, guests, rooms });

  // Apply policy checks
  const withPolicy = hotels.map(h => ({
    ...h,
    policyCheck: checkHotelPolicy(policyRules, h.nightlyRate, h.totalAmount, destination),
  })).sort((a, b) => {
    // Sort: compliant first, then by price
    if (a.policyCheck.compliant !== b.policyCheck.compliant) return a.policyCheck.compliant ? -1 : 1;
    return a.nightlyRate - b.nightlyRate;
  });

  return NextResponse.json({ hotels: withPolicy });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { hotelId, checkIn, checkOut, guests, rooms, hotelDetails } = body;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 400 });

    // Book hotel
    const bookingResult = await mockHotelProvider.book(hotelId, { checkIn, checkOut, guests, rooms });

    // Create trip + hotel booking
    const { data: trip } = await supabase.from('trips').insert({
      user_id: user.id,
      org_id: profile.org_id,
      title: `${hotelDetails?.name || 'Hotel'} - ${hotelDetails?.address || ''}`.trim(),
      status: 'booked',
      destination: hotelDetails?.address?.split(',').pop()?.trim() || '',
      start_date: checkIn,
      end_date: checkOut,
      total_cost: hotelDetails?.totalAmount || 0,
      currency: hotelDetails?.currency || 'GBP',
    }).select().single();

    if (trip) {
      await supabase.from('hotel_bookings').insert({
        trip_id: trip.id,
        provider: 'mock',
        provider_ref: bookingResult.ref,
        hotel_name: hotelDetails?.name || '',
        address: hotelDetails?.address || '',
        check_in: checkIn,
        check_out: checkOut,
        room_type: hotelDetails?.roomType || 'Standard',
        nightly_rate: hotelDetails?.nightlyRate || 0,
        total_amount: hotelDetails?.totalAmount || 0,
        currency: hotelDetails?.currency || 'GBP',
        status: 'confirmed',
      });

      await supabase.from('audit_log').insert({
        org_id: profile.org_id, actor_id: user.id, action: 'hotel_booked',
        entity_type: 'trip', entity_id: trip.id,
        metadata: { hotel: hotelDetails?.name, ref: bookingResult.ref },
      });
    }

    return NextResponse.json({ tripId: trip?.id, ref: bookingResult.ref, success: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Hotel booking failed');
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
