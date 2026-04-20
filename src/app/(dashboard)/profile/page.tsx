'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('*, organizations(name)').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setFullName(data.full_name);
          setDepartment(data.department || '');
        }
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ full_name: fullName, department }).eq('id', profile.id);
    setMessage(error ? 'Failed to save' : 'Profile updated');
    setSaving(false);
  };

  if (!profile) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 600 }}>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account settings.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
              {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{profile.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{profile.email} · {profile.role}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{(profile.organizations as any)?.name}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Department</label>
            <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Engineering, Sales, etc." style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Email</label>
            <input value={profile.email} disabled style={{ width: '100%', opacity: 0.6 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Role</label>
            <input value={profile.role} disabled style={{ width: '100%', opacity: 0.6, textTransform: 'capitalize' }} />
          </div>
        </div>

        {message && <p style={{ fontSize: 12, color: message.includes('Failed') ? 'var(--red)' : 'var(--green)', marginBottom: 12 }}>{message}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
