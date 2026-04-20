import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Voyager, a corporate travel booking assistant. Parse user messages and return structured JSON actions.

ACTIONS you can return:
1. search_flights: { "action": "search_flights", "params": { "origin": "LHR", "destination": "JFK", "departureDate": "2026-05-15", "returnDate": "2026-05-20", "passengers": "1", "cabinClass": "economy" } }
2. search_hotels: { "action": "search_hotels", "params": { "destination": "London", "checkIn": "2026-05-15", "checkOut": "2026-05-18", "guests": "1", "rooms": "1" } }
3. book_flight: { "action": "book_flight", "selectedIndex": 0 } (0-indexed from last search results)
4. book_hotel: { "action": "book_hotel", "selectedIndex": 0, "checkIn": "...", "checkOut": "..." }
5. text_response: { "action": "text", "response": "Your helpful text here" }

RULES:
- For flights: infer origin from context (default LHR for London). Parse dates like "next Tuesday", "May 15th", etc. into YYYY-MM-DD format. Today is ${new Date().toISOString().split('T')[0]}.
- For "book option 1" or "book the first one" or "book the cheapest", use selectedIndex: 0. "option 2" = index 1, etc.
- For "book the [carrier name]" look at lastFlights context to find the right index.
- For hotels: parse "3 nights from next Monday" into checkIn/checkOut dates.
- If unclear, ask a clarifying question via text_response.
- For policy questions, trip management, general questions, use text_response.
- ALWAYS return valid JSON. No markdown, no code blocks.
- When user says "book it" or "book that" with no specification, book index 0 (the top/best result).
- Be concise and helpful. Don't over-explain.`;

function parseRelativeDate(text: string): string {
  const now = new Date();
  const lower = text.toLowerCase();

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  // "next [day]"
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i])) {
      const target = i;
      const current = now.getDay();
      let diff = target - current;
      if (diff <= 0) diff += 7;
      if (lower.includes('next') && diff < 7) diff += 7;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }

  // "tomorrow"
  if (lower.includes('tomorrow')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // "in X days/weeks"
  const inDays = lower.match(/in (\d+) days?/);
  if (inDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inDays[1]));
    return d.toISOString().split('T')[0];
  }

  const inWeeks = lower.match(/in (\d+) weeks?/);
  if (inWeeks) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inWeeks[1]) * 7);
    return d.toISOString().split('T')[0];
  }

  // "next week"
  if (lower.includes('next week')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  // Fallback: 7 days from now
  const d = new Date(now);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

// Airport code mapping
const AIRPORT_MAP: Record<string, string> = {
  'london': 'LHR', 'heathrow': 'LHR', 'gatwick': 'LGW', 'stansted': 'STN',
  'new york': 'JFK', 'nyc': 'JFK', 'jfk': 'JFK', 'newark': 'EWR',
  'los angeles': 'LAX', 'la': 'LAX', 'san francisco': 'SFO', 'sf': 'SFO',
  'chicago': 'ORD', 'miami': 'MIA', 'boston': 'BOS', 'seattle': 'SEA',
  'paris': 'CDG', 'berlin': 'BER', 'amsterdam': 'AMS', 'frankfurt': 'FRA',
  'rome': 'FCO', 'barcelona': 'BCN', 'madrid': 'MAD', 'lisbon': 'LIS',
  'dubai': 'DXB', 'singapore': 'SIN', 'tokyo': 'HND', 'hong kong': 'HKG',
  'sydney': 'SYD', 'melbourne': 'MEL', 'toronto': 'YYZ', 'vancouver': 'YVR',
  'manchester': 'MAN', 'edinburgh': 'EDI', 'glasgow': 'GLA', 'birmingham': 'BHX',
  'dublin': 'DUB', 'zurich': 'ZRH', 'geneva': 'GVA', 'munich': 'MUC',
  'copenhagen': 'CPH', 'stockholm': 'ARN', 'oslo': 'OSL', 'helsinki': 'HEL',
  'istanbul': 'IST', 'athens': 'ATH', 'bangkok': 'BKK', 'mumbai': 'BOM',
  'delhi': 'DEL', 'beijing': 'PEK', 'shanghai': 'PVG', 'seoul': 'ICN',
};

function findAirport(text: string): string {
  const lower = text.toLowerCase();
  // Check for IATA codes directly (3 uppercase letters)
  const iataMatch = text.match(/\b([A-Z]{3})\b/);
  if (iataMatch) return iataMatch[1];

  for (const [city, code] of Object.entries(AIRPORT_MAP)) {
    if (lower.includes(city)) return code;
  }
  return '';
}

function localParse(message: string, lastFlights: any[], lastHotels: any[]): any {
  const lower = message.toLowerCase().trim();

  // Booking commands
  if (lower.match(/book\s+(option\s+)?(\d+|the\s+(first|second|third|fourth|fifth|cheapest|best|top))/i) || lower.match(/^book\s*(it|that|this)?$/i)) {
    const numMatch = lower.match(/option\s*(\d+)/i) || lower.match(/book\s*(\d+)/i);
    let idx = 0;

    if (numMatch) {
      idx = parseInt(numMatch[1]) - 1;
    } else if (lower.includes('second') || lower.includes('2nd')) {
      idx = 1;
    } else if (lower.includes('third') || lower.includes('3rd')) {
      idx = 2;
    } else if (lower.includes('fourth') || lower.includes('4th')) {
      idx = 3;
    } else if (lower.includes('fifth') || lower.includes('5th')) {
      idx = 4;
    }

    // Determine if booking flight or hotel
    if (lastFlights.length > 0 && (lower.includes('flight') || !lower.includes('hotel'))) {
      return { action: 'book_flight', selectedIndex: Math.min(idx, lastFlights.length - 1) };
    }
    if (lastHotels.length > 0) {
      return { action: 'book_hotel', selectedIndex: Math.min(idx, lastHotels.length - 1) };
    }

    return { action: 'text', response: 'No search results to book from. Search for flights or hotels first.' };
  }

  // Flight search
  if (lower.match(/\b(flight|fly|flights|flying)\b/i) || lower.match(/\b(to|from)\s+\w+.*(next|tomorrow|on|in \d)/i)) {
    const dest = findAirport(message);
    // Try to find origin and destination separately
    const fromMatch = lower.match(/from\s+(\w[\w\s]*?)(?:\s+to\s+|\s+on\s+|\s+next|\s+tomorrow|\s+in\s+\d|$)/i);
    const toMatch = lower.match(/to\s+(\w[\w\s]*?)(?:\s+from\s+|\s+on\s+|\s+next|\s+tomorrow|\s+in\s+\d|$)/i);

    let origin = 'LHR';
    let destination = '';

    if (fromMatch) {
      const fromCode = findAirport(fromMatch[1]);
      if (fromCode) origin = fromCode;
    }

    if (toMatch) {
      const toCode = findAirport(toMatch[1]);
      if (toCode) destination = toCode;
    }

    if (!destination && dest) destination = dest;
    if (!destination) {
      // Try to find any city name
      for (const [city, code] of Object.entries(AIRPORT_MAP)) {
        if (lower.includes(city) && code !== origin) {
          destination = code;
          break;
        }
      }
    }

    if (!destination) {
      return { action: 'text', response: 'Where would you like to fly to? Give me a city or airport code.' };
    }

    const departureDate = parseRelativeDate(message);
    const cabinMatch = lower.match(/\b(business|first|premium|economy)\b/i);
    const paxMatch = lower.match(/(\d+)\s*(passenger|pax|people|person|traveller)/i);

    return {
      action: 'search_flights',
      params: {
        origin,
        destination,
        departureDate,
        passengers: paxMatch ? paxMatch[1] : '1',
        cabinClass: cabinMatch ? cabinMatch[1].toLowerCase().replace('premium', 'premium_economy') : 'economy',
      },
    };
  }

  // Hotel search
  if (lower.match(/\b(hotel|stay|accommodation|room|lodge|hostel)\b/i)) {
    // Extract destination
    let destination = '';
    const inMatch = lower.match(/\b(?:in|at|near)\s+(\w[\w\s]*?)(?:\s+for|\s+from|\s+on|\s+next|\s+\d|$)/i);
    if (inMatch) destination = inMatch[1].trim();

    for (const city of Object.keys(AIRPORT_MAP)) {
      if (lower.includes(city) && city.length > 2) {
        destination = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    if (!destination) {
      return { action: 'text', response: 'Where do you need a hotel? Give me a city name.' };
    }

    const nightsMatch = lower.match(/(\d+)\s*nights?/i);
    const nights = nightsMatch ? parseInt(nightsMatch[1]) : 3;
    const checkIn = parseRelativeDate(message);
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + nights);
    const checkOut = checkInDate.toISOString().split('T')[0];

    return {
      action: 'search_hotels',
      params: { destination, checkIn, checkOut, guests: '1', rooms: '1' },
    };
  }

  // Policy questions
  if (lower.match(/\b(policy|policies|rule|limit|budget|cap)\b/i)) {
    return {
      action: 'text',
      response: 'Current travel policy:\n• Max flight price: £500\n• Allowed cabins: Economy, Premium Economy\n• Advance booking: 7+ days\n• Hotel nightly cap: £200\n• Approval required above: £1,000\n\nTo change policy, go to Admin → Travel Policy (admin only).',
    };
  }

  // Trips
  if (lower.match(/\b(trips?|bookings?|itinerar)\b/i) && lower.match(/\b(show|list|my|view|see)\b/i)) {
    return { action: 'text', response: 'Your trips are available in the sidebar under "My Trips". You can also search for new flights or hotels right here.' };
  }

  // Help
  if (lower.match(/\b(help|what can you|how do i)\b/i)) {
    return {
      action: 'text',
      response: 'I can help you with:\n• Search flights: "Find flights to Paris next Friday"\n• Search hotels: "Hotel in Berlin for 3 nights"\n• Book: "Book option 1" or "Book the cheapest"\n• Policy: "What\'s the travel policy?"\n• Trips: "Show my trips"\n\nJust tell me what you need in plain English.',
    };
  }

  // Greeting
  if (lower.match(/^(hi|hello|hey|good morning|good afternoon)\b/i)) {
    return { action: 'text', response: 'Hello! Where are you looking to travel? I can search flights, hotels, or help with your existing bookings.' };
  }

  // Fallback: try GPT if configured
  return null;
}

export async function POST(request: Request) {
  const { message, history, lastFlights, lastHotels } = await request.json();

  if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 });

  // Try local parsing first (fast, no API needed)
  const localResult = localParse(message, lastFlights || [], lastHotels || []);
  if (localResult) return NextResponse.json(localResult);

  // Try GPT if available
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).slice(-6),
            {
              role: 'user',
              content: `${message}\n\n[Context: lastFlights=${JSON.stringify((lastFlights || []).slice(0, 3).map((f: any) => ({ carrier: f.carrier, price: f.price })))}, lastHotels=${JSON.stringify((lastHotels || []).slice(0, 3).map((h: any) => ({ name: h.name, rate: h.nightlyRate })))}]`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      try {
        // Try to parse as JSON action
        const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json(parsed);
      } catch {
        // Return as text
        return NextResponse.json({ action: 'text', response: content });
      }
    } catch {}
  }

  // Final fallback
  return NextResponse.json({
    action: 'text',
    response: "I'm not sure what you mean. Try:\n• \"Flights to New York next week\"\n• \"Hotel in Paris for 2 nights\"\n• \"Book option 1\"\n• \"What's the travel policy?\"",
  });
}
