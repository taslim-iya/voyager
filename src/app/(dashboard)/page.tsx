import Link from 'next/link';
import { Plane, Hotel, Briefcase, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  let trips: any[] = [];
  let pendingApprovals = 0;
  let profileName = 'there';
  let budgetRemaining = 0;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const { formatCurrency, formatDate } = await import('@/lib/utils');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (p) {
          profileName = p.full_name?.split(' ')[0] || 'there';
          budgetRemaining = p.budget_remaining || 0;
        }

        const { data: t } = await supabase
          .from('trips')
          .select('*, flight_bookings(*), hotel_bookings(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        trips = t || [];

        if (p?.role === 'admin' || p?.role === 'manager') {
          const { count } = await supabase
            .from('approval_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
          pendingApprovals = count || 0;
        }
      }
    } catch {}
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Welcome back, {profileName}</h1>
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

      {trips.length === 0 && (
        <div className="empty-state">
          <Plane size={32} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
          <h3>No trips yet</h3>
          <p>Search for flights or hotels to get started. The platform works with mock data — no API keys needed for a demo.</p>
          <Link href="/search/flights" className="btn-primary" style={{ textDecoration: 'none', marginTop: 12, display: 'inline-flex' }}>Search Flights</Link>
        </div>
      )}
    </div>
  );
}
