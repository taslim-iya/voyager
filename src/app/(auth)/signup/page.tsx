'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Sign up auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, org_name: orgName } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // 2. Create organization
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, slug })
        .select()
        .single();

      if (orgError) {
        // If org creation fails (e.g., no DB), still redirect
        console.error('Org creation failed:', orgError);
      }

      // 3. Create user profile
      if (org) {
        await supabase.from('users').insert({
          id: authData.user.id,
          org_id: org.id,
          email,
          full_name: fullName,
          role: 'admin',
        });

        // 4. Create default policy
        await supabase.from('travel_policies').insert({
          org_id: org.id,
          name: 'Default Policy',
          is_default: true,
        });
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, letterSpacing: '-0.03em' }}>Voyager</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Start managing your company's travel</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Create Account</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Step {step} of 2 - {step === 1 ? 'Company Details' : 'Your Details'}</p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (orgName) setStep(2); } : handleSignup}>
            {step === 1 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Company Name</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} required style={{ width: '100%' }} placeholder="Acme Corp" />
              </div>
            )}

            {step === 2 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '100%' }} placeholder="Jane Smith" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Work Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} placeholder="jane@acme.com" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ width: '100%' }} />
                </div>
              </>
            )}

            {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              {step === 2 && <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}>
                {step === 1 ? 'Continue' : loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 16 }}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
