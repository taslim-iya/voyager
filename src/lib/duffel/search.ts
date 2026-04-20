import { getDuffel, isDuffelConfigured } from './client';
import type { FlightOffer, FlightSegment } from '@/lib/policy/scoring';

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: string;
}

// Mock flight data for when Duffel isn't configured
function generateMockFlights(params: SearchParams): FlightOffer[] {
  const carriers = [
    { code: 'BA', name: 'British Airways' },
    { code: 'LH', name: 'Lufthansa' },
    { code: 'AF', name: 'Air France' },
    { code: 'KL', name: 'KLM' },
    { code: 'EK', name: 'Emirates' },
    { code: 'FR', name: 'Ryanair' },
    { code: 'U2', name: 'easyJet' },
  ];

  const basePrice = params.cabinClass === 'business' ? 800 : params.cabinClass === 'first' ? 2000 : 150;

  return carriers.map((carrier, i) => {
    const price = Math.round(basePrice + Math.random() * basePrice * 0.8) * params.passengers;
    const durationBase = 120 + Math.floor(Math.random() * 360);
    const stops = i < 3 ? 0 : i < 5 ? 1 : Math.floor(Math.random() * 2);
    const depHour = 6 + Math.floor(Math.random() * 14);
    const dep = `${params.departureDate}T${String(depHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
    const arrMs = new Date(dep).getTime() + durationBase * 60000;
    const arr = new Date(arrMs).toISOString();

    return {
      id: `mock_${carrier.code}_${i}_${Date.now()}`,
      price,
      currency: 'GBP',
      duration: durationBase,
      stops,
      carrier: carrier.name,
      carrierLogo: `https://pics.avs.io/60/60/${carrier.code}.png`,
      cabin: params.cabinClass || 'economy',
      policyScore: 0, // filled by policy engine
      segments: [{
        origin: params.origin,
        destination: params.destination,
        departure: dep,
        arrival: arr,
        carrier: carrier.name,
        flightNumber: `${carrier.code}${100 + Math.floor(Math.random() * 900)}`,
        cabin: params.cabinClass || 'economy',
        duration: durationBase,
      }],
      deepLinkUrl: `https://www.google.com/travel/flights?q=Flights+to+${params.destination}+from+${params.origin}+on+${params.departureDate}`,
    } satisfies FlightOffer;
  });
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const duffel = getDuffel();

  if (!duffel) {
    // Return mock data
    return generateMockFlights(params);
  }

  try {
    const offerRequest = await duffel.offerRequests.create({
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        } as any,
        ...(params.returnDate ? [{
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
        } as any] : []),
      ],
      passengers: Array.from({ length: params.passengers }, () => ({ type: 'adult' as const })),
      cabin_class: params.cabinClass as any,
    });

    const offers = offerRequest.data.offers || [];

    return offers.slice(0, 20).map((offer: any) => {
      const slice = offer.slices?.[0];
      const segments: FlightSegment[] = (slice?.segments || []).map((seg: any) => ({
        origin: seg.origin?.iata_code || params.origin,
        destination: seg.destination?.iata_code || params.destination,
        departure: seg.departing_at,
        arrival: seg.arriving_at,
        carrier: seg.operating_carrier?.name || seg.marketing_carrier?.name || 'Unknown',
        flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
        cabin: params.cabinClass,
        duration: seg.duration ? parseDuration(seg.duration) : 0,
      }));

      const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

      return {
        id: offer.id,
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        duration: totalDuration || (slice?.duration ? parseDuration(slice.duration) : 0),
        stops: segments.length - 1,
        carrier: segments[0]?.carrier || 'Unknown',
        carrierLogo: offer.owner?.logo_symbol_url || offer.owner?.logo_lockup_url,
        cabin: params.cabinClass,
        segments,
        policyScore: 0,
        deepLinkUrl: `https://www.google.com/travel/flights?q=Flights+to+${params.destination}+from+${params.origin}+on+${params.departureDate}`,
      } satisfies FlightOffer;
    });
  } catch (error) {
    console.error('Duffel search error:', error);
    return generateMockFlights(params);
  }
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}

export async function searchPlaces(query: string): Promise<{ iata: string; name: string; city: string }[]> {
  const duffel = getDuffel();

  if (!duffel || query.length < 2) {
    // Mock airport data
    const airports = [
      { iata: 'LHR', name: 'Heathrow', city: 'London' },
      { iata: 'LGW', name: 'Gatwick', city: 'London' },
      { iata: 'STN', name: 'Stansted', city: 'London' },
      { iata: 'JFK', name: 'John F. Kennedy', city: 'New York' },
      { iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles' },
      { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris' },
      { iata: 'FRA', name: 'Frankfurt', city: 'Frankfurt' },
      { iata: 'DXB', name: 'Dubai Intl', city: 'Dubai' },
      { iata: 'SIN', name: 'Changi', city: 'Singapore' },
      { iata: 'HND', name: 'Haneda', city: 'Tokyo' },
      { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam' },
      { iata: 'MAN', name: 'Manchester', city: 'Manchester' },
      { iata: 'EDI', name: 'Edinburgh', city: 'Edinburgh' },
      { iata: 'BCN', name: 'El Prat', city: 'Barcelona' },
      { iata: 'FCO', name: 'Fiumicino', city: 'Rome' },
    ];
    const q = query.toLowerCase();
    return airports.filter(a => a.iata.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)).slice(0, 8);
  }

  try {
    const res = await duffel.suggestions.list({ query });
    return (res.data || []).filter((s: any) => s.type === 'airport').slice(0, 8).map((s: any) => ({
      iata: s.iata_code,
      name: s.name,
      city: s.city_name || s.city?.name || '',
    }));
  } catch {
    return [];
  }
}
