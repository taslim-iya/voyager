# Booking Flows

## Flow 1: Duffel Direct Booking

```
User searches flights
    │
    ▼
User clicks "Book via Duffel"
    │
    ▼
GET /api/duffel/reprice (re-price offer)
    │
    ▼
User fills passenger details form
    │
    ▼
POST /api/duffel/book
    ├── Create Trip (status: booked)
    ├── Call Duffel API → create order
    ├── Store FlightBooking with PNR
    ├── Log to audit_log
    ├── Send confirmation email (Resend)
    │
    ▼
Redirect to /book/confirm/[tripId]
    └── Shows PNR, trip details, total cost
```

## Flow 2: Deep Link (Airline Website)

```
User searches flights
    │
    ▼
User clicks "Open Airline Site"
    │
    ▼
Construct Google Flights URL with params
    │
    ▼
POST /api/duffel/book (method: deeplink)
    ├── Create Trip (status: booked_external)
    ├── Store FlightBooking (booking_method: deeplink)
    ├── Store deeplink_url
    ├── Log to audit_log
    │
    ▼
Open airline site in new tab
User completes booking externally
```

## Flow 3: EA Request (Executive Assistant)

```
User searches flights
    │
    ▼
User clicks "Request EA Booking"
    │
    ▼
POST /api/duffel/book (method: ea_request)
    ├── Create Trip (status: pending_approval)
    ├── Create ApprovalRequest (with policy violations)
    ├── Store FlightBooking (status: pending)
    ├── Email notification to admins/managers
    ├── Log to audit_log
    │
    ▼
Trip appears in Admin → Approvals queue
    │
    ├── Admin approves:
    │   ├── ApprovalRequest status → approved
    │   ├── Trip status → approved
    │   └── EA proceeds with manual booking
    │
    └── Admin rejects:
        ├── ApprovalRequest status → rejected
        └── Trip status → cancelled
```

## Hotel Booking Flow

```
User searches hotels
    │
    ▼
User clicks "Book Hotel"
    │
    ▼
POST /api/hotels/search
    ├── Call MockHotelProvider.book()
    ├── Create Trip (status: booked)
    ├── Store HotelBooking
    ├── Log to audit_log
    │
    ▼
Redirect to /trips/[tripId]
```
