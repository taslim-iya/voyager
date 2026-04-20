'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Users, Briefcase, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalSpend: 0, tripCount: 0, userCount: 0, pendingApprovals: 0, departmentSpend: [] as any[], recentTrips: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (!profile) return;

      const orgId = profile.org_id;

      const [tripsRes, usersRes, approvalsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('org_id', orgId),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
      ]);

      const trips = tripsRes.data || [];
      const totalSpend = trips.reduce((sum, t) => sum + (t.total_cost || 0), 0);

      // Department breakdown
      const deptMap: Record<string, number> = {};
      const { data: orgUsers } = await supabase.from('users').select('id, department').eq('org_id', orgId);
      const userDeptMap: Record<string, string> = {};
      (orgUsers || []).forEach(u => { userDeptMap[u.id] = u.department || 'Unassigned'; });
      trips.forEach(t => {
        const dept = userDeptMap[t.user_id] || 'Unassigned';
        deptMap[dept] = (deptMap[dept] || 0) + (t.total_cost || 0);
      });

      setStats({
        totalSpend,
        tripCount: trips.length,
        userCount: usersRes.count || 0,
        pendingApprovals: approvalsRes.count || 0,
        departmentSpend: Object.entries(deptMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
        recentTrips: trips.slice(0, 10),
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ width: 200, height: 20 }} /></div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Spend Dashboard</h1>
        <p>Overview of your organization's travel spend.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        <div className="card stat-card">
          <div className="stat-label">MTD Spend</div>
          <div className="stat-value">{formatCurrency(stats.totalSpend)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Trips</div>
          <div className="stat-value">{stats.tripCount}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Team Size</div>
          <div className="stat-value">{stats.userCount}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value" style={{ color: stats.pendingApprovals > 0 ? 'var(--orange)' : 'var(--text)' }}>{stats.pendingApprovals}</div>
        </div>
      </div>

      {/* Department spend */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Spend by Department</h3>
        {stats.departmentSpend.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No spend data yet.</p>
        ) : (
          <div>
            {stats.departmentSpend.map(d => {
              const pct = stats.totalSpend > 0 ? (d.amount / stats.totalSpend) * 100 : 0;
              return (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 120, fontSize: 12, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ flex: 1, height: 20, background: 'var(--bg-2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--text)', borderRadius: 'var(--radius)', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ width: 100, textAlign: 'right', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(d.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent trips table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14 }}>Recent Trips</h3>
        </div>
        {stats.recentTrips.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--text-3)' }}>No trips yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Destination</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTrips.map((t: any) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.title || 'Untitled'}</td>
                  <td>{t.destination || '-'}</td>
                  <td><span className={`badge ${t.status === 'booked' ? 'badge-success' : t.status === 'pending_approval' ? 'badge-warning' : 'badge-neutral'}`}>{t.status.replace(/_/g, ' ')}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(t.total_cost || 0, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
