'use client';

import { useState, useEffect, useRef } from 'react';
import { Plane, Search, ArrowRight, Clock, Check, AlertTriangle, ExternalLink, Mail, Loader2 } from 'lucide-react';
import { formatCurrency, formatDuration, classNames } from '@/lib/utils';

interface FlightResult {
  id: string;
  price: number;
  currency: string;
  duration: number;
  stops: number;
  carrier: string;
  carrierLogo?: string;
  cabin: string;
  segments: any[];
  policyScore: number;
  blendedScore: number;
  deepLinkUrl?: string;
  policyCheck?: { compliant: boolean; violations: { rule: string; message: string; severity: string }[]; requiresApproval: boolean };
}

interface Airport { iata: string; name: string; city: string; }

export default function FlightSearchPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originIata, setOriginIata] = useState('');
  const [destIata, setDestIata] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('economy');
  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Airport autocomplete
  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Airport[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const fetchAirports = async (query: string, setter: (a: Airport[]) => void) => {
    if (query.length < 2) { setter([]); return; }
    try {
      const res = await fetch(`/api/duffel/search?action=places&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setter(data.places || []);
    } catch { setter([]); }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchAirports(origin, setOriginSuggestions), 300);
    return () => clearTimeout(t);
  }, [origin]);

  useEffect(() => {
    const t = setTimeout(() => fetchAirports(destination, setDestSuggestions), 300);
    return () => clearTimeout(t);
  }, [destination]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const params = new URLSearchParams({
        origin: originIata || origin,
        destination: destIata || destination,
        departureDate,
        ...(returnDate && { returnDate }),
        passengers: String(passengers),
        cabinClass,
      });
      const res = await fetch(`/api/duffel/search?${params}`);
      const data = await res.json();
      setResults(data.offers || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (offer: FlightResult, method: 'duffel' | 'deeplink' | 'ea_request') => {
    if (method === 'deeplink' && offer.deepLinkUrl) {
      window.open(offer.deepLinkUrl, '_blank');
      return;
    }
    if (method === 'duffel') {
      window.location.href = `/book/duffel/${offer.id}?price=${offer.price}&currency=${offer.currency}&carrier=${encodeURIComponent(offer.carrier)}`;
      return;
    }
    if (method === 'ea_request') {
      // Create EA request
      try {
        const res = await fetch('/api/duffel/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId: offer.id, method: 'ea_request', flightDetails: offer }),
        });
        const data = await res.json();
        if (data.tripId) window.location.href = `/trips/${data.tripId}`;
      } catch (err) { console.error('EA request failed:', err); }
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Search Flights</h1>
        <p>Find the best flights within your travel policy.</p>
      </div>

      <form onSubmit={handleSearch} className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>From</label>
            <input value={origin} onChange={e => { setOrigin(e.target.value); setOriginIata(''); setShowOriginDropdown(true); }} onFocus={() => setShowOriginDropdown(true)} onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)} placeholder="London (LHR)" required style={{ width: '100%' }} />
            {showOriginDropdown && originSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 200, overflow: 'auto' }}>
                {originSuggestions.map(a => (
                  <div key={a.iata} onClick={() => { setOrigin(`${a.city} (${a.iata})`); setOriginIata(a.iata); setShowOriginDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <strong>{a.iata}</strong> - {a.name}, {a.city}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>To</label>
            <input value={destination} onChange={e => { setDestination(e.target.value); setDestIata(''); setShowDestDropdown(true); }} onFocus={() => setShowDestDropdown(true)} onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)} placeholder="New York (JFK)" required style={{ width: '100%' }} />
            {showDestDropdown && destSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 200, overflow: 'auto' }}>
                {destSuggestions.map(a => (
                  <div key={a.iata} onClick={() => { setDestination(`${a.city} (${a.iata})`); setDestIata(a.iata); setShowDestDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <strong>{a.iata}</strong> - {a.name}, {a.city}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Departure</label>
            <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Return</label>
            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Pax</label>
            <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} style={{ width: '100%' }}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Cabin</label>
            <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} style={{ width: '100%' }}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          <Search size={14} /> {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>

      {/* Score weights info */}
      {results.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 16, display: 'flex', gap: 16 }}>
          <span>Ranking weights:</span>
          <span style={{ fontWeight: 600 }}>Price 50%</span>
          <span style={{ fontWeight: 600 }}>Duration 30%</span>
          <span style={{ fontWeight: 600 }}>Policy 20%</span>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Searching flights...</p>
        </div>
      )}

      {/* Results */}
      {results.map((offer, i) => (
        <div key={offer.id} className="card" style={{ padding: 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center', width: 60 }}>
            {offer.carrierLogo && <img src={offer.carrierLogo} alt="" style={{ width: 32, height: 32, objectFit: 'contain', marginBottom: 4 }} />}
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{offer.carrier}</div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{offer.segments?.[0]?.origin || originIata || origin}</span>
              <ArrowRight size={12} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{offer.segments?.[0]?.destination || destIata || destination}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {formatDuration(offer.duration)}</span>
              <span>{offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</span>
              <span style={{ textTransform: 'capitalize' }}>{offer.cabin}</span>
            </div>
          </div>

          {/* Policy badge */}
          <div style={{ textAlign: 'center', width: 80 }}>
            {offer.policyCheck?.compliant ? (
              <span className="badge badge-success"><Check size={10} /> In Policy</span>
            ) : (
              <div>
                <span className="badge badge-warning"><AlertTriangle size={10} /> Out of Policy</span>
                {offer.policyCheck?.violations?.map((v, j) => (
                  <div key={j} style={{ fontSize: 9, color: 'var(--orange)', marginTop: 2 }}>{v.message}</div>
                ))}
              </div>
            )}
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', width: 50 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--serif)' }}>{Math.round(offer.blendedScore * 100)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)' }}>Score</div>
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right', width: 80 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(offer.price, offer.currency)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)' }}>per person</div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 130 }}>
            <button className="btn-primary" style={{ fontSize: 10, padding: '6px 10px', width: '100%', justifyContent: 'center' }} onClick={() => handleBook(offer, 'duffel')}>
              <Plane size={10} /> Book via Duffel
            </button>
            <button className="btn-secondary" style={{ fontSize: 10, padding: '6px 10px', width: '100%', justifyContent: 'center' }} onClick={() => handleBook(offer, 'deeplink')}>
              <ExternalLink size={10} /> Open Airline Site
            </button>
            <button className="btn-ghost" style={{ fontSize: 10, padding: '6px 10px', width: '100%', justifyContent: 'center' }} onClick={() => handleBook(offer, 'ea_request')}>
              <Mail size={10} /> Request EA Booking
            </button>
          </div>
        </div>
      ))}

      {searched && !loading && results.length === 0 && (
        <div className="empty-state">
          <Plane size={32} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
          <h3>No flights found</h3>
          <p>Try adjusting your search criteria or dates.</p>
        </div>
      )}
    </div>
  );
}
