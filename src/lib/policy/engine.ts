export interface PolicyRules {
  max_flight_price: number;
  cabin_class: string[];
  advance_booking_days: number;
  hotel_nightly_cap: number;
  requires_approval_above: number;
  allowed_airlines: string[];
  blacklisted_destinations: string[];
}

export interface PolicyViolation {
  rule: string;
  message: string;
  severity: 'warning' | 'block';
}

export interface PolicyCheckResult {
  compliant: boolean;
  violations: PolicyViolation[];
  requiresApproval: boolean;
  score: number; // 0-1, 1 = fully compliant
}

const DEFAULT_RULES: PolicyRules = {
  max_flight_price: 500,
  cabin_class: ['economy'],
  advance_booking_days: 7,
  hotel_nightly_cap: 200,
  requires_approval_above: 1000,
  allowed_airlines: [],
  blacklisted_destinations: [],
};

export function parseRules(json: any): PolicyRules {
  return { ...DEFAULT_RULES, ...json };
}

export function checkFlightPolicy(
  rules: PolicyRules,
  price: number,
  cabin: string,
  departureDate: string,
  destination?: string,
  airline?: string
): PolicyCheckResult {
  const violations: PolicyViolation[] = [];

  // Price check
  if (price > rules.max_flight_price) {
    violations.push({
      rule: 'max_flight_price',
      message: `Price exceeds policy limit of ${rules.max_flight_price}`,
      severity: price > rules.max_flight_price * 1.5 ? 'block' : 'warning',
    });
  }

  // Cabin class check
  if (rules.cabin_class.length > 0 && !rules.cabin_class.includes(cabin.toLowerCase())) {
    violations.push({
      rule: 'cabin_class',
      message: `${cabin} class not allowed. Policy allows: ${rules.cabin_class.join(', ')}`,
      severity: 'warning',
    });
  }

  // Advance booking
  if (departureDate) {
    const daysUntil = Math.floor((new Date(departureDate).getTime() - Date.now()) / 86400000);
    if (daysUntil < rules.advance_booking_days) {
      violations.push({
        rule: 'advance_booking_days',
        message: `Booked ${daysUntil} days in advance. Policy requires ${rules.advance_booking_days}+ days`,
        severity: 'warning',
      });
    }
  }

  // Blacklisted destinations
  if (destination && rules.blacklisted_destinations.some(d => destination.toLowerCase().includes(d.toLowerCase()))) {
    violations.push({
      rule: 'blacklisted_destinations',
      message: `${destination} is a restricted destination`,
      severity: 'block',
    });
  }

  // Airline restrictions
  if (airline && rules.allowed_airlines.length > 0 && !rules.allowed_airlines.includes(airline)) {
    violations.push({
      rule: 'allowed_airlines',
      message: `${airline} is not on the approved airline list`,
      severity: 'warning',
    });
  }

  const hasBlocking = violations.some(v => v.severity === 'block');
  const score = violations.length === 0 ? 1 : Math.max(0, 1 - violations.length * 0.25);
  const requiresApproval = price > rules.requires_approval_above || hasBlocking;

  return {
    compliant: violations.length === 0,
    violations,
    requiresApproval,
    score,
  };
}

export function checkHotelPolicy(
  rules: PolicyRules,
  nightlyRate: number,
  totalAmount: number,
  destination?: string
): PolicyCheckResult {
  const violations: PolicyViolation[] = [];

  if (nightlyRate > rules.hotel_nightly_cap) {
    violations.push({
      rule: 'hotel_nightly_cap',
      message: `Nightly rate exceeds policy cap of ${rules.hotel_nightly_cap}`,
      severity: nightlyRate > rules.hotel_nightly_cap * 1.5 ? 'block' : 'warning',
    });
  }

  if (destination && rules.blacklisted_destinations.some(d => destination.toLowerCase().includes(d.toLowerCase()))) {
    violations.push({
      rule: 'blacklisted_destinations',
      message: `${destination} is a restricted destination`,
      severity: 'block',
    });
  }

  const score = violations.length === 0 ? 1 : Math.max(0, 1 - violations.length * 0.3);
  const requiresApproval = totalAmount > rules.requires_approval_above;

  return { compliant: violations.length === 0, violations, requiresApproval, score };
}
