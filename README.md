# Voyager — B2B Corporate Travel Platform

Multi-tenant SaaS where companies sign up, invite employees, set travel policies, and employees search/book flights and hotels within policy guardrails.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + WPDS editorial design system
- **Auth & DB:** Supabase (Auth, Postgres, RLS)
- **Flights:** Duffel API (test mode)
- **Hotels:** Mock provider (clean interface for swapping)
- **Payments:** Stripe (subscription billing)
- **Email:** Resend (transactional)
- **Logging:** Pino (structured, org/user/trip context)
- **Package Manager:** pnpm

## Setup

```bash
# Install dependencies
pnpm install

# Copy env vars
cp .env.example .env.local

# Fill in your keys (see below)

# Run development server
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `DUFFEL_API_TOKEN` | No | Duffel API test token (falls back to mock flights) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (test mode) |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `RESEND_API_KEY` | No | Resend API key (falls back to console logging) |
| `NEXT_PUBLIC_APP_URL` | No | App URL (default: http://localhost:3000) |

## Duffel Test Account

1. Sign up at [duffel.com](https://duffel.com)
2. Create a test organization
3. Copy your test API token to `DUFFEL_API_TOKEN`
4. The app uses mock data when the token is missing

## Stripe Test Account

1. Sign up at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Use test mode keys
3. For webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Database Setup

Run the SQL migrations in `supabase/migrations/` in order (001-009) against your Supabase project.

## Features

### Traveler
- Flight search with airport autocomplete (Duffel Places API)
- Hotel search with mock provider
- Three booking flows: Duffel direct, airline deep-link, EA request
- Trip management with booking history
- Policy compliance badges on every result
- Mobile-responsive with bottom navigation

### Admin
- Spend dashboard with department breakdown
- User management with invite flow
- Travel policy editor (JSONB rules)
- Trip oversight with status/date/cost filters
- Approval queue with approve/reject
- CSV/XLSX export (Ramp/Brex/Expensify compatible)

### Policy Engine
- Server-side evaluation at search time AND pre-booking
- Rules: max price, cabin class, advance booking, hotel cap, airline/destination restrictions
- Blended scoring: 50% price, 30% duration, 20% policy compliance
- Automatic approval routing for out-of-policy bookings

## Architecture

```
app/
├── (auth)/          # Login, signup, invite accept
├── (dashboard)/     # Traveler pages (search, trips, book, profile)
├── (admin)/admin/   # Admin pages (dashboard, users, policy, approvals, export)
└── api/             # Server-side routes (Duffel, hotels, Stripe, invites, export)

lib/
├── supabase/        # Client, server, middleware
├── duffel/          # Client, search, book (with mock fallback)
├── hotels/          # Provider interface + mock implementation
├── stripe/          # Client, billing
├── email/           # Resend (with console fallback)
├── policy/          # Engine + scoring
└── utils.ts         # Formatters, classNames
```

## Documentation

- [Data Model](docs/data-model.md) — ER diagram, table descriptions, JSONB schemas
- [Policy Engine](docs/policy-engine.md) — Rule evaluation, scoring algorithm, approval routing
- [Booking Flows](docs/booking-flows.md) — Sequence diagrams for all 3 booking paths
