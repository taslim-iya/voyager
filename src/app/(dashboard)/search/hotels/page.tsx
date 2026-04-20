'use client';

import { useState } from 'react';
import { Hotel, Search, Star, Check, AlertTriangle, Loader2, Wifi, Dumbbell, Coffee, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface HotelResult {
  id: string; name: string; address: string; starRating: number;
  nightlyRate: number; totalAmount: number; currency: string;
  roomType: string; amenities: string[]; imageUrl: string;
  policyCheck?: { compliant: boolean; violations: any[] };
}

export default function HotelSearchPage() {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ destination, checkIn, checkOut, guests: String(guests), rooms: String(rooms) });
      const res = await fetch(`/api/hotels/search?${params}`);
      const data = await res.json();
      setResults(data.hotels || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBook = async (hotel: HotelResult) => {
    try {
      const res = await fetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.id, checkIn, checkOut, guests, rooms, hotelDetails: hotel }),
      });
      const data = await res.json();
      if (data.tripId) window.location.href = `/trips/${data.tripId}`;
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Search Hotels</h1>
        <p>Find accommodation within your travel policy.</p>
      </div>

      <form onSubmit={handleSearch} className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 80px', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Destination</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="London" required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Check-in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Check-out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Guests</label>
            <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={{ width: '100%' }}>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Rooms</label>
            <select value={rooms} onChange={e => setRooms(Number(e.target.value))} style={{ width: '100%' }}>
              {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          <Search size={14} /> {loading ? 'Searching...' : 'Search Hotels'}
        </button>
      </form>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {results.map(hotel => (
          <div key={hotel.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 160, background: 'var(--bg-3)', position: 'relative' }}>
              <img src={hotel.imageUrl} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                {hotel.policyCheck?.compliant ? (
                  <span className="badge badge-success"><Check size={8} /> In Policy</span>
                ) : (
                  <span className="badge badge-warning"><AlertTriangle size={8} /> Out of Policy</span>
                )}
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {Array.from({ length: hotel.starRating }).map((_, i) => <Star key={i} size={10} fill="var(--gold)" color="var(--gold)" />)}
              </div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>{hotel.name}</h3>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{hotel.address}</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>{hotel.roomType}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {hotel.amenities.slice(0, 4).map(a => (
                  <span key={a} style={{ fontSize: 9, color: 'var(--text-3)', background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 'var(--radius)' }}>{a}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(hotel.nightlyRate, hotel.currency)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>/night</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 'auto' }}>Total: {formatCurrency(hotel.totalAmount, hotel.currency)}</span>
              </div>
              {hotel.policyCheck?.violations?.map((v: any, j: number) => (
                <div key={j} style={{ fontSize: 10, color: 'var(--orange)', marginBottom: 4 }}>{v.message}</div>
              ))}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleBook(hotel)}>
                Book Hotel
              </button>
            </div>
          </div>
        ))}
      </div>

      {searched && !loading && results.length === 0 && (
        <div className="empty-state">
          <Hotel size={32} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
          <h3>No hotels found</h3>
          <p>Try a different destination or dates.</p>
        </div>
      )}
    </div>
  );
}
