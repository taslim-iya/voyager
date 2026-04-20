'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plane, Hotel, Briefcase, Clock, Check, AlertTriangle, ExternalLink, Loader2, Star, ArrowRight, Bot, User } from 'lucide-react';
import { formatCurrency, formatDuration, formatDate } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any; // flights, hotels, trips, etc.
  dataType?: 'flights' | 'hotels' | 'trips' | 'booking' | 'approval' | 'policy';
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to Voyager. I'm your travel assistant — tell me what you need.\n\nTry things like:\n• \"Find flights to New York next Tuesday\"\n• \"Search hotels in London for 3 nights\"\n• \"Show my trips\"\n• \"What's the travel policy?\"\n• \"Book the cheapest option\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFlights, setLastFlights] = useState<any[]>([]);
  const [lastHotels, setLastHotels] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, data?: any, dataType?: string) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: new Date(),
      data,
      dataType: dataType as any,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMessage('user', text);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          lastFlights: lastFlights.slice(0, 5).map(f => ({ id: f.id, carrier: f.carrier, price: f.price, duration: f.duration, stops: f.stops })),
          lastHotels: lastHotels.slice(0, 5).map(h => ({ id: h.id, name: h.name, nightlyRate: h.nightlyRate, starRating: h.starRating })),
        }),
      });

      const data = await res.json();

      if (data.action === 'search_flights' && data.params) {
        addMessage('assistant', 'Searching flights...');
        const params = new URLSearchParams(data.params);
        const flightRes = await fetch(`/api/duffel/search?${params}`);
        const flightData = await flightRes.json();
        const offers = flightData.offers || [];
        setLastFlights(offers);

        if (offers.length > 0) {
          addMessage('assistant', `Found ${offers.length} flights from ${data.params.origin} to ${data.params.destination}. Here are the best options:`, offers.slice(0, 5), 'flights');
        } else {
          addMessage('assistant', 'No flights found for those dates. Try different dates or destinations.');
        }
      } else if (data.action === 'search_hotels' && data.params) {
        addMessage('assistant', 'Searching hotels...');
        const params = new URLSearchParams(data.params);
        const hotelRes = await fetch(`/api/hotels/search?${params}`);
        const hotelData = await hotelRes.json();
        const hotels = hotelData.hotels || [];
        setLastHotels(hotels);

        if (hotels.length > 0) {
          addMessage('assistant', `Found ${hotels.length} hotels in ${data.params.destination}:`, hotels.slice(0, 5), 'hotels');
        } else {
          addMessage('assistant', 'No hotels found. Try a different destination or dates.');
        }
      } else if (data.action === 'book_flight' && data.selectedIndex !== undefined) {
        const offer = lastFlights[data.selectedIndex];
        if (offer) {
          const bookRes = await fetch('/api/duffel/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: offer.id,
              method: 'duffel',
              title: `${offer.carrier} to ${offer.segments?.[0]?.destination || 'destination'}`,
              flightDetails: offer,
              passengers: [],
            }),
          });
          const bookData = await bookRes.json();
          if (bookData.pnr) {
            addMessage('assistant', `Booked! Your PNR is **${bookData.pnr}**. ${offer.carrier} flight for ${formatCurrency(offer.price, offer.currency)}.`, bookData, 'booking');
          } else {
            addMessage('assistant', `Trip created. ${bookData.tripId ? `Trip ID: ${bookData.tripId}` : 'Check your trips page for details.'}`);
          }
        } else {
          addMessage('assistant', 'Could not find that flight. Please search again.');
        }
      } else if (data.action === 'book_hotel' && data.selectedIndex !== undefined) {
        const hotel = lastHotels[data.selectedIndex];
        if (hotel) {
          const bookRes = await fetch('/api/hotels/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotelId: hotel.id, hotelDetails: hotel, checkIn: data.checkIn, checkOut: data.checkOut, guests: 1, rooms: 1 }),
          });
          const bookData = await bookRes.json();
          addMessage('assistant', `Hotel booked! ${hotel.name} for ${formatCurrency(hotel.totalAmount, hotel.currency)}.`, bookData, 'booking');
        }
      } else {
        // Plain text response
        addMessage('assistant', data.response || data.message || 'I can help you search flights, hotels, manage trips, and more. What would you like to do?');
      }
    } catch (err) {
      addMessage('assistant', 'Something went wrong. Try again or rephrase your request.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: msg.role === 'user' ? 'flex-start' : 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--text)' : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: msg.role === 'user' ? 'var(--bg)' : 'var(--text)',
                  marginTop: 2,
                }}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {msg.role === 'user' ? 'You' : 'Voyager'}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                  {/* Flight results */}
                  {msg.dataType === 'flights' && msg.data && (
                    <div style={{ marginTop: 12 }}>
                      {msg.data.map((offer: any, i: number) => (
                        <div key={offer.id} className="card" style={{ padding: 16, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ textAlign: 'center', width: 50, flexShrink: 0 }}>
                            {offer.carrierLogo && <img src={offer.carrierLogo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                            <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{offer.carrier}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>
                              {offer.segments?.[0]?.origin || '?'} → {offer.segments?.[0]?.destination || '?'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                              {formatDuration(offer.duration)} · {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`} · {offer.cabin}
                            </div>
                          </div>
                          {offer.policyCheck?.compliant ? (
                            <span className="badge badge-success" style={{ flexShrink: 0 }}><Check size={8} /> Policy</span>
                          ) : (
                            <span className="badge badge-warning" style={{ flexShrink: 0 }}><AlertTriangle size={8} /> OOP</span>
                          )}
                          <div style={{ textAlign: 'right', flexShrink: 0, width: 70 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(offer.price, offer.currency)}</div>
                          </div>
                        </div>
                      ))}
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Say "book option 1" or "book the cheapest" to proceed.</p>
                    </div>
                  )}

                  {/* Hotel results */}
                  {msg.dataType === 'hotels' && msg.data && (
                    <div style={{ marginTop: 12 }}>
                      {msg.data.map((hotel: any, i: number) => (
                        <div key={hotel.id} className="card" style={{ padding: 16, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{hotel.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {Array.from({ length: hotel.starRating }).map((_, j) => <Star key={j} size={8} fill="var(--gold)" color="var(--gold)" />)}
                              <span style={{ marginLeft: 4 }}>{hotel.roomType}</span>
                            </div>
                          </div>
                          {hotel.policyCheck?.compliant ? (
                            <span className="badge badge-success" style={{ flexShrink: 0 }}><Check size={8} /> Policy</span>
                          ) : (
                            <span className="badge badge-warning" style={{ flexShrink: 0 }}>OOP</span>
                          )}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(hotel.nightlyRate, hotel.currency)}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-3)' }}>/night</div>
                          </div>
                        </div>
                      ))}
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Say "book option 1" or "book the Hilton" to proceed.</p>
                    </div>
                  )}

                  {/* Booking confirmation */}
                  {msg.dataType === 'booking' && msg.data?.pnr && (
                    <div className="card" style={{ padding: 16, marginTop: 12, borderColor: 'var(--green)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check size={16} style={{ color: 'var(--green)' }} />
                        <span style={{ fontSize: 14, fontWeight: 700 }}>Booking Confirmed</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', marginTop: 8 }}>PNR: {msg.data.pnr}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} />
              </div>
              <div style={{ paddingTop: 6 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 40px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Search flights, book hotels, manage trips..."
              style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading || !input.trim()} style={{ padding: '12px 20px' }}>
              <Send size={16} />
            </button>
          </form>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>
            Voyager AI — searches flights & hotels, books travel, manages policy
          </div>
        </div>
      </div>
    </div>
  );
}
