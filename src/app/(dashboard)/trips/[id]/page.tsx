'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plane, Hotel, FileText } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

const STATUS_BADGES: Record<string, string> = {
  draft: 'badge-neutral', pending_approval: 'badge-warning', approved: 'badge-info',
  booked: 'badge-success', booked_external: 'badge-success', cancelled: 'badge-danger',
  completed: 'badge-neutral', confirmed: 'badge-success', ticketed: 'badge-gold', pending: 'badge-warning',
};

export default function TripDetailPage() {
  const params = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('trips')
          .select('*, flight_bookings(*), hotel_bookings(*), approval_requests(*)')
          .eq('id', params.id)
          .single();
        setTrip(data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ width: 300, height: 30 }} /></div>;
  if (!trip) return <div style={{ padding: 40 }}><p>Trip not found. <Link href="/trips">Back to Trips</Link></p></div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <Link href="/trips" style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to Trips
      </Link>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>{trip.title || trip.destination || 'Trip Details'}</h1>
          <p>{trip.destination && `${trip.destination} · `}{trip.start_date && formatDate(trip.start_date)}{trip.end_date && ` - ${formatDate(trip.end_date)}`}</p>
        </div>
        <span className={`badge ${STATUS_BADGES[trip.status] || 'badge-neutral'}`} style={{ fontSize: 11, padding: '4px 12px' }}>{trip.status.replace(/_/g, ' ')}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        <div className="card stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">{formatCurrency(trip.total_cost || 0, trip.currency)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Purpose</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{trip.purpose || '-'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Created</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{formatDateTime(trip.created_at)}</div>
        </div>
      </div>

      {trip.flight_bookings?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Plane size={18} /> Flight Bookings</h2>
          {trip.flight_bookings.map((fb: any) => (
            <div key={fb.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span className={`badge ${STATUS_BADGES[fb.status] || 'badge-neutral'}`}>{fb.status}</span>
                  {fb.pnr && <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', marginLeft: 8 }}>PNR: {fb.pnr}</span>}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(fb.total_amount, fb.currency)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Method: {fb.booking_method}</div>
            </div>
          ))}
        </div>
      )}

      {trip.hotel_bookings?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Hotel size={18} /> Hotel Bookings</h2>
          {trip.hotel_bookings.map((hb: any) => (
            <div key={hb.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{hb.hotel_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{formatDate(hb.check_in)} - {formatDate(hb.check_out)}</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>{formatCurrency(hb.total_amount, hb.currency)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
