import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plane, Hotel, Briefcase, Clock, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let trips: any[] = [];
  let pendingApprovals = 0;
  let profile: any = null;

  if (user) {
    const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single();
    profile = p;

    const { data: t } = await supabase
      .from('trips')
      .select('*, flight_bookings(*), hotel_bookings(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    trips = t || [];

    if (profile?.role === 'admin' || profile?.role === 'manager') {
      const { count } = await supabase
        .from('approval_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingApprovals = count || 0;
    }
  }

  const upcomingTrips = trips.filter(t => t.status === 'booked' || t.status === 'approved');
  const pendingTrips = trips.filter(t => t.status === 'pending_approval');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Welcome back{profile ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
        <p>Search flights, manage trips, and stay on policy.</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
        <Link href="/search/flights" className="card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Plane size={20} style={{ color: 'var(--text-3)' }} />
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>Search Flights</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Find and book flights</div></div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
        </Link>
        <Link href="/search/hotels" className="card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Hotel size={20} style={{ color: 'var(--text-3)' }} />
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>Search Hotels</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Find accommodation</div></div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
        </Link>
        <Link href="/trips" className="card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Briefcase size={20} style={{ color: 'var(--text-3)' }} />
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>My Trips</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{trips.length} trips</div></div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
        </Link>
      </div>

      {/* Pending approvals alert */}
      {pendingApprovals > 0 && (
        <Link href="/admin/approvals" className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', borderColor: 'var(--orange)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--orange)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{pendingApprovals} pending approval{pendingApprovals > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Review travel requests from your team</div>
          </div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
        </Link>
      )}

      {/* Upcoming trips */}
      {upcomingTrips.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Upcoming Trips</h2>
          {upcomingTrips.map(trip => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card" style={{ padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
              <CheckCircle size={16} style={{ color: 'var(--green)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{trip.title || trip.destination || 'Untitled Trip'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {trip.start_date && formatDate(trip.start_date)}{trip.end_date && ` - ${formatDate(trip.end_date)}`}
                </div>
              </div>
              {trip.total_cost > 0 && <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(trip.total_cost, trip.currency)}</span>}
              <span className={`badge ${trip.status === 'booked' ? 'badge-success' : 'badge-info'}`}>{trip.status.replace(/_/g, ' ')}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Pending trips */}
      {pendingTrips.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pending Approval</h2>
          {pendingTrips.map(trip => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card" style={{ padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
              <Clock size={16} style={{ color: 'var(--orange)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{trip.title || trip.destination || 'Untitled Trip'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{trip.start_date && formatDate(trip.start_date)}</div>
              </div>
              <span className="badge badge-warning">Pending</span>
            </Link>
          ))}
        </div>
      )}

      {trips.length === 0 && (
        <div className="empty-state">
          <Plane size={32} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
          <h3>No trips yet</h3>
          <p>Search for flights or hotels to get started.</p>
          <Link href="/search/flights" className="btn-primary" style={{ textDecoration: 'none' }}>Search Flights</Link>
        </div>
      )}

      {/* Budget */}
      {profile?.budget_remaining > 0 && (
        <div className="card" style={{ padding: 16, marginTop: 24 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Remaining Budget</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--serif)' }}>{formatCurrency(profile.budget_remaining)}</div>
        </div>
      )}
    </div>
  );
}
