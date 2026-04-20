'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Plus, Mail, Loader2, Trash2, Edit } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('traveler');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteBudget, setInviteBudget] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (!profile) return;
      setOrgId(profile.org_id);
      const { data } = await supabase.from('users').select('*').eq('org_id', profile.org_id).order('created_at');
      setUsers(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage('');
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', email: inviteEmail, role: inviteRole, department: inviteDept, budget: parseFloat(inviteBudget) || 0, orgId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err: any) { setMessage(err.message); }
    finally { setInviting(false); }
  };

  const updateRole = async (userId: string, role: string) => {
    const supabase = createClient();
    await supabase.from('users').update({ role }).eq('id', userId);
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  };

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ width: 200, height: 20 }} /></div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1>Team Members</h1><p>{users.length} users in your organization</p></div>
        <button className="btn-primary" onClick={() => setShowInvite(!showInvite)}><Plus size={14} /> Invite User</button>
      </div>

      {message && <p style={{ fontSize: 12, color: message.includes('sent') ? 'var(--green)' : 'var(--red)', marginBottom: 12 }}>{message}</p>}

      {showInvite && (
        <form onSubmit={handleInvite} className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Invite New Member</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required style={{ width: '100%' }} placeholder="colleague@company.com" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: '100%' }}>
                <option value="traveler">Traveler</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Department</label>
              <input value={inviteDept} onChange={e => setInviteDept(e.target.value)} style={{ width: '100%' }} placeholder="Engineering" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Budget</label>
              <input type="number" value={inviteBudget} onChange={e => setInviteBudget(e.target.value)} style={{ width: '100%' }} placeholder="5000" />
            </div>
            <button type="submit" className="btn-primary" disabled={inviting}>
              {inviting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
              Send
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th style={{ textAlign: 'right' }}>Budget</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ color: 'var(--text-2)' }}>{u.email}</td>
                <td>
                  <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={{ fontSize: 11, padding: '2px 6px', textTransform: 'capitalize' }}>
                    <option value="traveler">Traveler</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{u.department || '-'}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(u.budget_remaining || 0)}</td>
                <td style={{ color: 'var(--text-3)', fontSize: 11 }}>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
