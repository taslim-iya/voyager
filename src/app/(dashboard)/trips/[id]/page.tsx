import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plane, Hotel, Check, Clock, XCircle, FileText } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

const STATUS_BADGES: Record<string, string> = {
  draft: 'badge-neutral', pending_approval: 'badge-warning', approved: 'badge-info',
  booked: 'badge-success', booked_external: 'badge-success', cancelled: 'badge-danger',
  completed: 'badge-neutral', confirmed: 'badge-success', ticketed: 'badge-gold', pending: 'badge-warning',
};

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from('trips')
    .select('*, flight_bookings(*), hotel_bookings(*), approval_requests(*)')
    .eq('id', params.id)
    .single();

  if (!trip) notFound();

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

      {/* Trip details */}
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

      {trip.justification && (
        <div className="card" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>Justification</div>
          <p style={{ fontSize: 13 }}>{trip.justification}</p>
        </div>
      )}

      {/* Flight bookings */}
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
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                <span>Method: {fb.booking_method}</span>
                {fb.booked_at && <span style={{ marginLeft: 16 }}>Booked: {formatDateTime(fb.booked_at)}</span>}
              </div>
              {fb.segments?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {fb.segments.map((seg: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: '4px 0', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                      {seg.origin} → {seg.destination} · {seg.carrier} {seg.flightNumber} · {seg.departure && new Date(seg.departure).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ))}
                </div>
              )}
              {fb.deeplink_url && (
                <a href={fb.deeplink_url} target="_blank" rel="noopener" style={{ fontSize: 11, marginTop: 8, display: 'inline-block' }}>View on airline site →</a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hotel bookings */}
      {trip.hotel_bookings?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Hotel size={18} /> Hotel Bookings</h2>
          {trip.hotel_bookings.map((hb: any) => (
            <div key={hb.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{hb.hotel_name}</span>
                  <span className={`badge ${STATUS_BADGES[hb.status] || 'badge-neutral'}`} style={{ marginLeft: 8 }}>{hb.status}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(hb.total_amount, hb.currency)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {hb.address && <div>{hb.address}</div>}
                <div>{formatDate(hb.check_in)} - {formatDate(hb.check_out)} · {hb.room_type || 'Standard'}</div>
                {hb.nightly_rate && <div>{formatCurrency(hb.nightly_rate, hb.currency)}/night</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval requests */}
      {trip.approval_requests?.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> Approval History</h2>
          {trip.approval_requests.map((ar: any) => (
            <div key={ar.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className={`badge ${STATUS_BADGES[ar.status] || 'badge-neutral'}`}>{ar.status}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDateTime(ar.created_at)}</span>
              </div>
              {ar.reason && <p style={{ fontSize: 12, marginTop: 4 }}>{ar.reason}</p>}
              {ar.policy_violations?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {ar.policy_violations.map((v: any, i: number) => (
                    <span key={i} className="badge badge-warning" style={{ marginRight: 4, marginTop: 2 }}>{v.message || v.rule}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
