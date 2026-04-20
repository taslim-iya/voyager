import { NextResponse } from 'next/server';
import { createBooking } from '@/lib/duffel/book';
import { createClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendApprovalNotification } from '@/lib/email/resend';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  const body = await request.json();
  const { offerId, method, passengers, title, purpose, justification, flightDetails } = body;

  if (!offerId) return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('org_id, email, full_name').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'No profile found' }, { status: 400 });

    // Create trip
    const { data: trip, error: tripError } = await supabase.from('trips').insert({
      user_id: user.id,
      org_id: profile.org_id,
      title: title || 'Flight booking',
      status: method === 'ea_request' ? 'pending_approval' : method === 'deeplink' ? 'booked_external' : 'booked',
      purpose,
      justification,
      total_cost: flightDetails?.price || 0,
      currency: flightDetails?.currency || 'GBP',
    }).select().single();

    if (tripError || !trip) {
      logger.error({ tripError }, 'Failed to create trip');
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
    }

    if (method === 'duffel') {
      // Book via Duffel
      const bookingResult = await createBooking({ offerId, passengers: passengers || [], paymentType: 'balance' });

      // Store flight booking
      await supabase.from('flight_bookings').insert({
        trip_id: trip.id,
        duffel_offer_id: offerId,
        duffel_order_id: bookingResult.orderId,
        pnr: bookingResult.pnr,
        segments: flightDetails?.segments || [],
        passengers: passengers || [],
        total_amount: flightDetails?.price || 0,
        currency: flightDetails?.currency || 'GBP',
        booking_method: 'duffel',
        status: bookingResult.success ? 'confirmed' : 'pending',
      });

      // Log audit
      await supabase.from('audit_log').insert({
        org_id: profile.org_id,
        actor_id: user.id,
        action: 'flight_booked',
        entity_type: 'trip',
        entity_id: trip.id,
        metadata: { method: 'duffel', pnr: bookingResult.pnr, amount: flightDetails?.price },
      });

      // Send confirmation email
      if (bookingResult.pnr) {
        await sendBookingConfirmation(profile.email, bookingResult.pnr, title || 'Flight');
      }

      return NextResponse.json({ tripId: trip.id, pnr: bookingResult.pnr, success: bookingResult.success });
    }

    if (method === 'deeplink') {
      // Store as external booking
      await supabase.from('flight_bookings').insert({
        trip_id: trip.id,
        segments: flightDetails?.segments || [],
        total_amount: flightDetails?.price || 0,
        currency: flightDetails?.currency || 'GBP',
        booking_method: 'deeplink',
        deeplink_url: flightDetails?.deepLinkUrl,
        status: 'pending',
      });

      await supabase.from('audit_log').insert({
        org_id: profile.org_id, actor_id: user.id, action: 'deeplink_booking',
        entity_type: 'trip', entity_id: trip.id,
      });

      return NextResponse.json({ tripId: trip.id });
    }

    if (method === 'ea_request') {
      // Create approval request
      await supabase.from('approval_requests').insert({
        trip_id: trip.id,
        org_id: profile.org_id,
        requester_id: user.id,
        status: 'pending',
        policy_violations: flightDetails?.policyCheck?.violations || [],
      });

      await supabase.from('flight_bookings').insert({
        trip_id: trip.id,
        segments: flightDetails?.segments || [],
        total_amount: flightDetails?.price || 0,
        currency: flightDetails?.currency || 'GBP',
        booking_method: 'ea_request',
        status: 'pending',
      });

      // Notify admins
      const { data: admins } = await supabase.from('users').select('email').eq('org_id', profile.org_id).in('role', ['admin', 'manager']);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      for (const admin of (admins || [])) {
        await sendApprovalNotification(admin.email, profile.full_name, title || 'Trip', `${appUrl}/admin/approvals`);
      }

      await supabase.from('audit_log').insert({
        org_id: profile.org_id, actor_id: user.id, action: 'ea_request_created',
        entity_type: 'trip', entity_id: trip.id,
      });

      return NextResponse.json({ tripId: trip.id });
    }

    return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Booking failed');
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
