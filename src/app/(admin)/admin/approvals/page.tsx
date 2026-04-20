'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [trips, setTrips] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (!profile) return;

      const [reqRes, tripsRes, usersRes] = await Promise.all([
        supabase.from('approval_requests').select('*').eq('org_id', profile.org_id).order('created_at', { ascending: false }),
        supabase.from('trips').select('*').eq('org_id', profile.org_id),
        supabase.from('users').select('id, full_name, email, department').eq('org_id', profile.org_id),
      ]);

      setRequests(reqRes.data || []);
      const tMap: Record<string, any> = {};
      (tripsRes.data || []).forEach(t => { tMap[t.id] = t; });
      setTrips(tMap);
      const uMap: Record<string, any> = {};
      (usersRes.data || []).forEach(u => { uMap[u.id] = u; });
      setUsers(uMap);
      setLoading(false);
    };
    load();
  }, []);

  const handleDecision = async (requestId: string, tripId: string, decision: 'approved' | 'rejected', reason?: string) => {
    setProcessing(requestId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('approval_requests').update({
      status: decision,
      approver_id: user?.id,
      reason: reason || null,
      decided_at: new Date().toISOString(),
    }).eq('id', requestId);

    if (decision === 'approved') {
      await supabase.from('trips').update({ status: 'approved' }).eq('id', tripId);
    } else {
      await supabase.from('trips').update({ status: 'cancelled' }).eq('id', tripId);
    }

    setRequests(requests.map(r => r.id === requestId ? { ...r, status: decision } : r));
    setProcessing('');
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ width: 200, height: 20 }} /></div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div className="page-header">
        <h1>Approval Queue</h1>
        <p>{pending.length} pending requests</p>
      </div>

      {pending.length === 0 && resolved.length === 0 && (
        <div className="empty-state">
          <CheckCircle size={32} style={{ color: 'var(--green)', marginBottom: 8 }} />
          <h3>All clear</h3>
          <p>No approval requests at the moment.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--orange)' }}>Pending ({pending.length})</h2>
          {pending.map(req => {
            const trip = trips[req.trip_id];
            const requester = users[req.requester_id];
            return (
              <div key={req.id} className="card" style={{ padding: 20, marginBottom: 8, borderColor: 'var(--orange)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{trip?.title || trip?.destination || 'Trip Request'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      Requested by <strong>{requester?.full_name || 'Unknown'}</strong>
                      {requester?.department && ` · ${requester.department}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{formatDateTime(req.created_at)}</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(trip?.total_cost || 0, trip?.currency)}</span>
                </div>

                {req.policy_violations?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>Policy Violations</div>
                    {req.policy_violations.map((v: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--orange)', marginBottom: 2 }}>
                        <AlertTriangle size={12} /> {v.message || v.rule}
                      </div>
                    ))}
                  </div>
                )}

                {trip?.justification && (
                  <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg-2)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 4 }}>Justification</div>
                    <p style={{ fontSize: 12 }}>{trip.justification}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-danger" onClick={() => handleDecision(req.id, req.trip_id, 'rejected')} disabled={processing === req.id}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="btn-primary" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => handleDecision(req.id, req.trip_id, 'approved')} disabled={processing === req.id}>
                    {processing === req.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Resolved ({resolved.length})</h2>
          {resolved.slice(0, 20).map(req => {
            const trip = trips[req.trip_id];
            const requester = users[req.requester_id];
            return (
              <div key={req.id} className="card" style={{ padding: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                {req.status === 'approved' ? <CheckCircle size={16} style={{ color: 'var(--green)' }} /> : <XCircle size={16} style={{ color: 'var(--red)' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{trip?.title || trip?.destination || 'Trip'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{requester?.full_name} · {formatDateTime(req.decided_at || req.created_at)}</div>
                </div>
                <span className={`badge ${req.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>{req.status}</span>
                <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{formatCurrency(trip?.total_cost || 0)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
