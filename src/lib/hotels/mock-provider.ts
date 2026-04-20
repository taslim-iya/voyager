import type { HotelProvider, HotelSearchParams, HotelResult } from './provider';

const HOTEL_CHAINS = [
  { name: 'The Grand Hotel', stars: 5, base: 280 },
  { name: 'Premier Inn', stars: 3, base: 85 },
  { name: 'Hilton', stars: 4, base: 180 },
  { name: 'Holiday Inn Express', stars: 3, base: 95 },
  { name: 'Marriott', stars: 4, base: 200 },
  { name: 'Travelodge', stars: 2, base: 55 },
  { name: 'The Ritz', stars: 5, base: 450 },
  { name: 'ibis', stars: 2, base: 65 },
  { name: 'Novotel', stars: 3, base: 120 },
  { name: 'Hyatt Regency', stars: 4, base: 220 },
];

const AMENITIES_BY_STAR: Record<number, string[]> = {
  2: ['WiFi', 'TV'],
  3: ['WiFi', 'TV', 'Breakfast', 'Gym'],
  4: ['WiFi', 'TV', 'Breakfast', 'Gym', 'Room Service', 'Bar'],
  5: ['WiFi', 'TV', 'Breakfast', 'Gym', 'Room Service', 'Bar', 'Spa', 'Pool', 'Concierge'],
};

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return ((h >>> 0) % 1000) / 1000;
}

export class MockHotelProvider implements HotelProvider {
  name = 'mock';

  async search(params: HotelSearchParams): Promise<HotelResult[]> {
    const nights = Math.max(1, Math.floor((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86400000));

    return HOTEL_CHAINS.map((hotel, i) => {
      const seed = `${params.destination}-${hotel.name}-${params.checkIn}`;
      const variance = seededRandom(seed) * 0.4 - 0.2; // -20% to +20%
      const nightlyRate = Math.round(hotel.base * (1 + variance) * params.rooms);
      const totalAmount = nightlyRate * nights;

      return {
        id: `mock_hotel_${i}_${params.destination}`,
        name: `${hotel.name} ${params.destination}`,
        address: `${Math.floor(seededRandom(seed + 'addr') * 200) + 1} High Street, ${params.destination}`,
        starRating: hotel.stars,
        nightlyRate,
        totalAmount,
        currency: 'GBP',
        roomType: hotel.stars >= 4 ? 'Deluxe Room' : 'Standard Room',
        amenities: AMENITIES_BY_STAR[hotel.stars] || AMENITIES_BY_STAR[3],
        imageUrl: `https://source.unsplash.com/400x300/?hotel,${hotel.name.split(' ')[0].toLowerCase()}`,
        policyScore: 0, // filled by policy engine
        provider: 'mock',
        providerRef: `MOCK${String(i).padStart(6, '0')}`,
      };
    });
  }

  async getDetails(id: string): Promise<HotelResult | null> {
    return null; // Not needed for mock
  }

  async book(id: string, guestDetails: any): Promise<{ success: boolean; ref?: string; error?: string }> {
    return { success: true, ref: `MOCK_BK_${Date.now().toString(36).toUpperCase()}` };
  }
}

export const mockHotelProvider = new MockHotelProvider();
