'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plane, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function DuffelBookPage({ params }: { params: { offerId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const price = parseFloat(searchParams.get('price') || '0');
  const currency = searchParams.get('currency') || 'GBP';
  const carrier = searchParams.get('carrier') || '';

  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [titleField, setTitleField] = useState('mr');
  const [purpose, setPurpose] = useState('');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/duffel/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: params.offerId,
          method: 'duffel',
          title: purpose || `${carrier} flight`,
          purpose,
          justification,
          passengers: [{
            title: titleField,
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth: dob,
            gender,
          }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.tripId) router.push(`/book/confirm/${data.tripId}`);
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700 }}>
      <Link href="/search/flights" style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to Search
      </Link>

      <div className="page-header">
        <h1>Complete Booking</h1>
        <p>{carrier && `${carrier} · `}{formatCurrency(price, currency)} · Offer {params.offerId.slice(0, 8)}...</p>
      </div>

      <form onSubmit={handleBook}>
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Trip Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Trip Purpose</label>
              <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Client meeting in NYC" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Justification</label>
              <input value={justification} onChange={e => setJustification(e.target.value)} placeholder="Required for Q1 review" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Passenger Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Title</label>
              <select value={titleField} onChange={e => setTitleField(e.target.value)} style={{ width: '100%' }}>
                <option value="mr">Mr</option>
                <option value="ms">Ms</option>
                <option value="mrs">Mrs</option>
                <option value="dr">Dr</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%' }} placeholder="+44..." />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(price, currency)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Total charge</div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px' }}>
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Booking...</> : <><Plane size={14} /> Confirm Booking</>}
          </button>
        </div>
      </form>
    </div>
  );
}
