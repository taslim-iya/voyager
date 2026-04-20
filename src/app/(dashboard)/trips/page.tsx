'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Briefcase, Plane, Hotel } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGES: Record<string, string> = {
  draft: 'badge-neutral', pending_approval: 'badge-warning', approved: 'badge-info',
  booked: 'badge-success', booked_external: 'badge-success', cancelled: 'badge-danger', completed: 'badge-neutral',
};

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('trips')
            .select('*, flight_bookings(count), hotel_bookings(count)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setTrips(data || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1>My Trips</h1>
        <p>{trips.length} trips total</p>
      </div>

      {loading ? (
        <div><div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ width: '100%', height: 60 }} /></div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={32} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
          <h3>No trips yet</h3>
          <p>Book a flight or hotel to create your first trip.</p>
          <Link href="/search/flights" className="btn-primary" style={{ textDecoration: 'none' }}>Search Flights</Link>
        </div>
      ) : (
        <div>
          {trips.map((trip: any) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card" style={{ padding: 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} style={{ color: 'var(--text-3)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{trip.title || trip.destination || 'Untitled Trip'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 12 }}>
                  {trip.destination && <span>{trip.destination}</span>}
                  {trip.start_date && <span>{formatDate(trip.start_date)}{trip.end_date ? ` - ${formatDate(trip.end_date)}` : ''}</span>}
                </div>
              </div>
              {trip.total_cost > 0 && <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(trip.total_cost, trip.currency)}</span>}
              <span className={`badge ${STATUS_BADGES[trip.status] || 'badge-neutral'}`}>{trip.status.replace(/_/g, ' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
