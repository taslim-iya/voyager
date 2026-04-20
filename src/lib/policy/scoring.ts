export interface ScoreWeights {
  price: number;
  duration: number;
  policy: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  price: 0.5,
  duration: 0.3,
  policy: 0.2,
};

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  duration: number; // minutes
  stops: number;
  carrier: string;
  carrierLogo?: string;
  cabin: string;
  segments: FlightSegment[];
  policyScore: number; // 0-1 from policy engine
  deepLinkUrl?: string;
}

export interface FlightSegment {
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  carrier: string;
  flightNumber: string;
  cabin: string;
  duration: number;
}

export function calculateBlendedScore(
  offer: { price: number; duration: number; policyScore: number },
  allOffers: { price: number; duration: number }[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  if (allOffers.length === 0) return 0;

  const minPrice = Math.min(...allOffers.map(o => o.price));
  const maxPrice = Math.max(...allOffers.map(o => o.price));
  const minDuration = Math.min(...allOffers.map(o => o.duration));
  const maxDuration = Math.max(...allOffers.map(o => o.duration));

  // Normalize: lower is better for both, so invert
  const priceScore = maxPrice === minPrice ? 1 : 1 - (offer.price - minPrice) / (maxPrice - minPrice);
  const durationScore = maxDuration === minDuration ? 1 : 1 - (offer.duration - minDuration) / (maxDuration - minDuration);

  return (
    priceScore * weights.price +
    durationScore * weights.duration +
    offer.policyScore * weights.policy
  );
}

export function sortByBlendedScore(offers: FlightOffer[], weights: ScoreWeights = DEFAULT_WEIGHTS): (FlightOffer & { blendedScore: number })[] {
  const withScores = offers.map(o => ({
    ...o,
    blendedScore: calculateBlendedScore(o, offers, weights),
  }));
  return withScores.sort((a, b) => b.blendedScore - a.blendedScore);
}
