'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Plane, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ConfirmationPage() {
  const params = useParams();
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('trips')
          .select('*, flight_bookings(*), hotel_bookings(*)')
          .eq('id', params.tripId)
          .single();
        setTrip(data);
      } catch {}
    };
    load();
  }, [params.tripId]);

  const flightBooking = trip?.flight_bookings?.[0];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28 }}>Booking Confirmed</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 8 }}>{trip?.title || 'Your trip has been booked'}</p>
      </div>

      {trip && (
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
          {flightBooking?.pnr && (
            <div style={{ paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plane size={14} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Flight</span>
                <span className="badge badge-gold">PNR: {flightBooking.pnr}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {trip && <Link href={`/trips/${trip.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>View Trip Details <ArrowRight size={14} /></Link>}
        <Link href="/search/flights" className="btn-secondary" style={{ textDecoration: 'none' }}>Search More Flights</Link>
      </div>
    </div>
  );
}
