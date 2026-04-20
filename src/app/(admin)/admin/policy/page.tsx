'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Save, Loader2, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PolicyRules {
  max_flight_price: number;
  cabin_class: string[];
  advance_booking_days: number;
  hotel_nightly_cap: number;
  requires_approval_above: number;
  allowed_airlines: string[];
  blacklisted_destinations: string[];
}

const DEFAULT_RULES: PolicyRules = {
  max_flight_price: 500,
  cabin_class: ['economy'],
  advance_booking_days: 7,
  hotel_nightly_cap: 200,
  requires_approval_above: 1000,
  allowed_airlines: [],
  blacklisted_destinations: [],
};

const CABIN_OPTIONS = ['economy', 'premium_economy', 'business', 'first'];

export default function PolicyEditorPage() {
  const [policy, setPolicy] = useState<any>(null);
  const [rules, setRules] = useState<PolicyRules>(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [newAirline, setNewAirline] = useState('');
  const [newDest, setNewDest] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (!profile) return;
      const { data } = await supabase.from('travel_policies').select('*').eq('org_id', profile.org_id).eq('is_default', true).single();
      if (data) { setPolicy(data); setRules({ ...DEFAULT_RULES, ...data.rules }); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('travel_policies').update({ rules, updated_at: new Date().toISOString() }).eq('id', policy.id);
    setMessage(error ? 'Failed to save' : 'Policy updated');
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ width: 200, height: 20 }} /></div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1>Travel Policy</h1><p>Configure your organization's travel rules.</p></div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>

      {message && <p style={{ fontSize: 12, color: message.includes('Failed') ? 'var(--red)' : 'var(--green)', marginBottom: 12 }}>{message}</p>}

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Flight Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Max Flight Price (GBP)</label>
            <input type="number" value={rules.max_flight_price} onChange={e => setRules({ ...rules, max_flight_price: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Advance Booking (Days)</label>
            <input type="number" value={rules.advance_booking_days} onChange={e => setRules({ ...rules, advance_booking_days: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Allowed Cabin Classes</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {CABIN_OPTIONS.map(c => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={rules.cabin_class.includes(c)} onChange={e => {
                  setRules({ ...rules, cabin_class: e.target.checked ? [...rules.cabin_class, c] : rules.cabin_class.filter(x => x !== c) });
                }} />
                <span style={{ textTransform: 'capitalize' }}>{c.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Hotel Rules</h3>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Max Nightly Rate (GBP)</label>
          <input type="number" value={rules.hotel_nightly_cap} onChange={e => setRules({ ...rules, hotel_nightly_cap: Number(e.target.value) })} style={{ width: 200 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Approval Rules</h3>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Requires Approval Above (GBP)</label>
          <input type="number" value={rules.requires_approval_above} onChange={e => setRules({ ...rules, requires_approval_above: Number(e.target.value) })} style={{ width: 200 }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Trips costing more than this amount will require manager/admin approval.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Restrictions</h3>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Approved Airlines</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {rules.allowed_airlines.map(a => (
              <span key={a} className="badge badge-neutral" style={{ cursor: 'pointer' }} onClick={() => setRules({ ...rules, allowed_airlines: rules.allowed_airlines.filter(x => x !== a) })}>
                {a} <X size={8} />
              </span>
            ))}
            {rules.allowed_airlines.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>All airlines allowed</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newAirline} onChange={e => setNewAirline(e.target.value)} placeholder="e.g. British Airways" style={{ width: 200 }} />
            <button type="button" className="btn-secondary" onClick={() => { if (newAirline) { setRules({ ...rules, allowed_airlines: [...rules.allowed_airlines, newAirline] }); setNewAirline(''); } }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Blacklisted Destinations</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {rules.blacklisted_destinations.map(d => (
              <span key={d} className="badge badge-danger" style={{ cursor: 'pointer' }} onClick={() => setRules({ ...rules, blacklisted_destinations: rules.blacklisted_destinations.filter(x => x !== d) })}>
                {d} <X size={8} />
              </span>
            ))}
            {rules.blacklisted_destinations.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No restrictions</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newDest} onChange={e => setNewDest(e.target.value)} placeholder="e.g. North Korea" style={{ width: 200 }} />
            <button type="button" className="btn-secondary" onClick={() => { if (newDest) { setRules({ ...rules, blacklisted_destinations: [...rules.blacklisted_destinations, newDest] }); setNewDest(''); } }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
