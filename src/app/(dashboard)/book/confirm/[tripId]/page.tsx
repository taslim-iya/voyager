import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Plane, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ConfirmationPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from('trips')
    .select('*, flight_bookings(*), hotel_bookings(*)')
    .eq('id', params.tripId)
    .single();

  if (!trip) notFound();

  const flightBooking = trip.flight_bookings?.[0];
  const hotelBooking = trip.hotel_bookings?.[0];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28 }}>Booking Confirmed</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 8 }}>{trip.title || trip.destination || 'Your trip has been booked'}</p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>Trip Reference</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{trip.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{formatCurrency(trip.total_cost || 0, trip.currency)}</div>
          </div>
        </div>

        {flightBooking && (
          <div style={{ paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Plane size={14} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Flight</span>
              {flightBooking.pnr && <span className="badge badge-gold">PNR: {flightBooking.pnr}</span>}
            </div>
            <div style={{ fontSize: 13 }}>
              {flightBooking.segments?.map((seg: any, i: number) => (
                <div key={i} style={{ padding: '4px 0' }}>
                  {seg.origin} → {seg.destination} · {seg.carrier} {seg.flightNumber}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>{formatCurrency(flightBooking.total_amount, flightBooking.currency)}</div>
          </div>
        )}

        {hotelBooking && (
          <div style={{ paddingTop: 16, borderTop: flightBooking ? '1px solid var(--border-subtle)' : 'none', marginTop: flightBooking ? 16 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{hotelBooking.hotel_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{formatDate(hotelBooking.check_in)} - {formatDate(hotelBooking.check_out)}</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>{formatCurrency(hotelBooking.total_amount, hotelBooking.currency)}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Link href={`/trips/${trip.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>View Trip Details <ArrowRight size={14} /></Link>
        <Link href="/search/flights" className="btn-secondary" style={{ textDecoration: 'none' }}>Search More Flights</Link>
      </div>
    </div>
  );
}
