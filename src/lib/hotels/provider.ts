export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelResult {
  id: string;
  name: string;
  address: string;
  starRating: number;
  nightlyRate: number;
  totalAmount: number;
  currency: string;
  roomType: string;
  amenities: string[];
  imageUrl: string;
  policyScore: number;
  provider: string;
  providerRef: string;
}

export interface HotelProvider {
  name: string;
  search(params: HotelSearchParams): Promise<HotelResult[]>;
  getDetails(id: string): Promise<HotelResult | null>;
  book(id: string, guestDetails: any): Promise<{ success: boolean; ref?: string; error?: string }>;
}
