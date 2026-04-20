import { getDuffel } from './client';

export interface BookingParams {
  offerId: string;
  passengers: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
  }[];
  paymentType: 'balance' | 'arc_bsp_cash'; // Duffel payment types
}

export interface BookingResult {
  success: boolean;
  orderId?: string;
  pnr?: string;
  error?: string;
}

export async function repriceOffer(offerId: string): Promise<{ price: number; currency: string; available: boolean }> {
  const duffel = getDuffel();

  if (!duffel || offerId.startsWith('mock_')) {
    // Mock reprice
    const basePrice = 150 + Math.random() * 400;
    return { price: Math.round(basePrice * 100) / 100, currency: 'GBP', available: true };
  }

  try {
    const offer = await duffel.offers.get(offerId);
    return {
      price: parseFloat(offer.data.total_amount),
      currency: offer.data.total_currency,
      available: (offer.data as any).available ?? true,
    };
  } catch (error: any) {
    return { price: 0, currency: 'GBP', available: false };
  }
}

export async function createBooking(params: BookingParams): Promise<BookingResult> {
  const duffel = getDuffel();

  if (!duffel || params.offerId.startsWith('mock_')) {
    // Mock booking
    const mockPnr = `VYG${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      success: true,
      orderId: `mock_order_${Date.now()}`,
      pnr: mockPnr,
    };
  }

  try {
    const order = await duffel.orders.create({
      type: 'instant',
      selected_offers: [params.offerId],
      passengers: params.passengers.map((p, i) => ({
        id: `pas_${i}`,
        title: p.title as any,
        given_name: p.firstName,
        family_name: p.lastName,
        email: p.email,
        phone_number: p.phone,
        born_on: p.dateOfBirth,
        gender: p.gender as any,
        type: 'adult' as const,
      })),
      payments: [{
        type: params.paymentType,
        amount: '0', // Will be auto-calculated
        currency: 'GBP',
      }],
    });

    return {
      success: true,
      orderId: order.data.id,
      pnr: order.data.booking_reference,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Booking failed',
    };
  }
}
