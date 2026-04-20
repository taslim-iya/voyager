# Data Model

## ER Diagram

```mermaid
erDiagram
    organizations ||--o{ users : "has"
    organizations ||--o{ travel_policies : "has"
    organizations ||--o{ trips : "has"
    organizations ||--o{ approval_requests : "has"
    organizations ||--o{ audit_log : "has"
    users ||--o{ trips : "creates"
    users ||--o{ approval_requests : "requests"
    users ||--o{ approval_requests : "approves"
    trips ||--o{ flight_bookings : "has"
    trips ||--o{ hotel_bookings : "has"
    trips ||--o{ approval_requests : "requires"

    organizations {
        uuid id PK
        text name
        text slug UK
        text billing_status
        text stripe_customer_id
        text stripe_subscription_id
        jsonb policy_config
    }

    users {
        uuid id PK
        uuid org_id FK
        text email
        text full_name
        text role
        text department
        numeric budget_remaining
        uuid invited_by FK
    }

    travel_policies {
        uuid id PK
        uuid org_id FK
        text name
        jsonb rules
        boolean is_default
    }

    trips {
        uuid id PK
        uuid user_id FK
        uuid org_id FK
        text title
        text status
        text purpose
        text destination
        date start_date
        date end_date
        numeric total_cost
        text currency
        text justification
    }

    flight_bookings {
        uuid id PK
        uuid trip_id FK
        text duffel_offer_id
        text duffel_order_id
        text pnr
        jsonb segments
        jsonb passengers
        numeric total_amount
        text booking_method
        text deeplink_url
        text status
    }

    hotel_bookings {
        uuid id PK
        uuid trip_id FK
        text provider
        text provider_ref
        text hotel_name
        date check_in
        date check_out
        numeric total_amount
        text status
    }

    approval_requests {
        uuid id PK
        uuid trip_id FK
        uuid org_id FK
        uuid requester_id FK
        uuid approver_id FK
        text status
        text reason
        jsonb policy_violations
    }

    audit_log {
        uuid id PK
        uuid org_id FK
        uuid actor_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb diff
        jsonb metadata
    }
```

## JSONB Schemas

### travel_policies.rules
```json
{
  "max_flight_price": 500,
  "cabin_class": ["economy"],
  "advance_booking_days": 7,
  "hotel_nightly_cap": 200,
  "requires_approval_above": 1000,
  "allowed_airlines": [],
  "blacklisted_destinations": []
}
```

### flight_bookings.segments
```json
[{
  "origin": "LHR",
  "destination": "JFK",
  "departure": "2024-03-15T08:00:00Z",
  "arrival": "2024-03-15T11:00:00Z",
  "carrier": "British Airways",
  "flightNumber": "BA117",
  "cabin": "economy",
  "duration": 480
}]
```
