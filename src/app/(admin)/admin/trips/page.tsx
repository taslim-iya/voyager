'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

const STATUS_BADGES: Record<string, string> = {
  draft: 'badge-neutral', pending_approval: 'badge-warning', approved: 'badge-info',
  booked: 'badge-success', booked_external: 'badge-success', cancelled: 'badge-danger', completed: 'badge-neutral',
};

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (!profile) return;

      const [tripsRes, usersRes] = await Promise.all([
        supabase.from('trips').select('*').eq('org_id', profile.org_id).order('created_at', { ascending: false }),
        supabase.from('users').select('id, full_name, department').eq('org_id', profile.org_id),
      ]);

      setTrips(tripsRes.data || []);
      const uMap: Record<string, any> = {};
      (usersRes.data || []).forEach(u => { uMap[u.id] = u; });
      setUsers(uMap);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = statusFilter === 'all' ? trips : trips.filter(t => t.status === statusFilter);

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ width: 200, height: 20 }} /></div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1>All Trips</h1><p>{filtered.length} trips</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-3)' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12 }}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Traveler</th>
              <th>Destination</th>
              <th>Dates</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td><Link href={`/trips/${t.id}`} style={{ fontWeight: 500 }}>{t.title || 'Untitled'}</Link></td>
                <td>{users[t.user_id]?.full_name || '-'}</td>
                <td>{t.destination || '-'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{t.start_date ? formatDate(t.start_date) : '-'}</td>
                <td><span className={`badge ${STATUS_BADGES[t.status] || 'badge-neutral'}`}>{t.status.replace(/_/g, ' ')}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(t.total_cost || 0, t.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ padding: 20, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>No trips found.</p>}
      </div>
    </div>
  );
}
