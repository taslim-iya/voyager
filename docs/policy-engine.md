# Policy Engine

## Overview
The policy engine evaluates travel bookings against organization-defined rules at two points:
1. **Search time** — results are scored and flagged
2. **Pre-booking** — final compliance check before payment

## Rule Evaluation Flow

```
Search Request
    │
    ▼
Fetch org's default travel_policy
    │
    ▼
For each flight/hotel result:
    ├── Check max_flight_price / hotel_nightly_cap
    ├── Check cabin_class allowlist
    ├── Check advance_booking_days
    ├── Check blacklisted_destinations
    ├── Check allowed_airlines
    │
    ▼
Generate PolicyCheckResult:
    ├── compliant: boolean
    ├── violations: [{rule, message, severity}]
    ├── requiresApproval: boolean
    └── score: 0-1 (used in blended ranking)
```

## Scoring Algorithm

Each flight offer receives a **blended score** (0-1):

```
blendedScore = (priceScore × 0.5) + (durationScore × 0.3) + (policyScore × 0.2)
```

Where:
- **priceScore**: Normalized 0-1 (cheapest = 1, most expensive = 0)
- **durationScore**: Normalized 0-1 (shortest = 1, longest = 0)
- **policyScore**: From policy engine (1 = fully compliant, reduced by 0.25 per violation)

Results are sorted descending by blended score.

## Approval Routing

If `totalCost > requires_approval_above` OR any violation has `severity: "block"`:
1. Trip status set to `pending_approval`
2. ApprovalRequest created with violations attached
3. Email notification sent to org admins/managers
4. Trip appears in admin Approval Queue
5. Admin approves → trip status = `approved` → booking proceeds
6. Admin rejects → trip status = `cancelled`
