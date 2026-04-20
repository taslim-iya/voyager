import { NextResponse } from 'next/server';
import { searchFlights, searchPlaces } from '@/lib/duffel/search';
import { checkFlightPolicy, parseRules } from '@/lib/policy/engine';
import { sortByBlendedScore } from '@/lib/policy/scoring';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Airport/places search
  if (action === 'places') {
    const query = searchParams.get('query') || '';
    const places = await searchPlaces(query);
    return NextResponse.json({ places });
  }

  // Flight search
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || undefined;
  const passengers = parseInt(searchParams.get('passengers') || '1');
  const cabinClass = searchParams.get('cabinClass') || 'economy';

  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  try {
    // Get user's policy
    let policyRules = parseRules({});
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single();
        if (profile) {
          const { data: policy } = await supabase.from('travel_policies').select('rules').eq('org_id', profile.org_id).eq('is_default', true).single();
          if (policy) policyRules = parseRules(policy.rules);
        }
      }
    } catch {}

    const rawOffers = await searchFlights({ origin, destination, departureDate, returnDate, passengers, cabinClass });

    // Apply policy checks
    const offersWithPolicy = rawOffers.map(offer => {
      const policyCheck = checkFlightPolicy(policyRules, offer.price, offer.cabin, departureDate, destination, offer.carrier);
      return { ...offer, policyScore: policyCheck.score, policyCheck };
    });

    // Sort by blended score
    const sorted = sortByBlendedScore(offersWithPolicy);

    logger.info({ origin, destination, departureDate, resultCount: sorted.length }, 'Flight search completed');

    return NextResponse.json({ offers: sorted });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Flight search failed');
    return NextResponse.json({ error: 'Search failed', offers: [] }, { status: 500 });
  }
}
