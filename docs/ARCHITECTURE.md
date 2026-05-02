# Architecture

## Overview

Maitri is a **multi-tenant SaaS** PMS. One Postgres database serves many hotels, with row-level security ensuring tenant isolation.

```
┌─────────────────────────────────────────────────────────┐
│  Guests across channels                                  │
│  LINE · WhatsApp · WeChat · Email · Web · OTAs          │
└──────────────┬──────────────────────────────────────────┘
               │ Webhooks
               ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 (Vercel)                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │   Public      │ │  Dashboard    │ │  Webhooks    │    │
│  │   Booking     │ │  (Operators)  │ │  Endpoints   │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                            │                              │
│  ┌────────────┬────────────┼────────────┬─────────────┐ │
│  ▼            ▼            ▼            ▼             ▼ │
│ ┌────┐  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌────────┐│
│ │ AI │  │ Channels │  │ Payment │  │  CM    │  │Compliance││
│ └────┘  └──────────┘  └─────────┘  └────────┘  └────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (Postgres + Auth + Realtime + Storage)         │
│  ~40 tables · RLS enabled · Singapore region             │
└─────────────────────────────────────────────────────────┘
```

## Data model

### Multi-tenancy

```
organizations (1) ─< hotels (many)
                    │
                    └─< rooms, reservations, guests, ...
```

- Every tenant table has `hotel_id` or `organization_id`
- RLS policies use `auth.user_organization_id()` helper
- Cross-tenant access is impossible at the DB level

### Core entities

| Entity         | Purpose                                                              |
| -------------- | -------------------------------------------------------------------- |
| `reservations` | Bookings · status flow: pending → confirmed → checked_in → out       |
| `guests`       | Guest profiles · PII · loyalty                                       |
| `rooms`        | Physical rooms · status (available, occupied, cleaning, maintenance) |
| `room_types`   | Categories with pricing                                              |
| `conversations`| Inbox threads, one per guest+channel                                 |
| `messages`     | Individual messages with translations                                |
| `folios`       | Financial accounts per reservation                                   |
| `invoices`     | Tax invoices, e-Tax submissions                                      |
| `payments`     | Transaction records                                                  |
| `housekeeping_tasks` | Cleaning queue                                                 |

## Communication flow

### Inbound (Guest → Hotel)

```
Guest sends LINE message
        ↓
LINE webhook (POST /api/webhooks/line)
        ↓
Verify HMAC signature
        ↓
Find/create conversation by channel_user_id
        ↓
Detect language (Claude)
        ↓
Translate to Thai (Claude)
        ↓
Insert into messages table
        ↓
Update conversations.unread_count
        ↓
Supabase Realtime pushes to inbox UI
```

### Outbound (Hotel → Guest)

```
Staff types reply in Thai
        ↓
[Optional] AI generates suggestion (Claude with conversation context + hotel KB)
        ↓
Translate Thai → guest language with cultural adaptation
        ↓
Send via channel adapter
        ↓
Save outbound message (with translation pair)
        ↓
Channel returns delivery receipt → update message status
```

## AI architecture

### Models

| Use case               | Model              | Why                                  |
| ---------------------- | ------------------ | ------------------------------------ |
| Translation            | Claude 3.5 Sonnet  | Best quality, cultural awareness     |
| Suggested replies      | Claude 3.5 Sonnet  | Reasoning over conversation context  |
| Sentiment analysis     | Claude 3.5 Haiku   | Cheaper for simple classification    |
| Dynamic pricing        | Claude 3.5 Sonnet  | Multi-factor decision making         |
| Review summarization   | Claude 3.5 Haiku   | Fast, low-stakes                     |

### Cultural adaptation

Translations aren't literal. The AI knows:
- **Japanese**: Use keigo (敬語), avoid direct refusals, soften language
- **Mandarin (Mainland)**: Simplified characters, professional tone
- **Mandarin (Taiwan/HK)**: Traditional, slightly different vocab
- **Korean**: Honorifics (-습니다/-니다 forms)
- **Thai**: ครับ/ค่ะ ending matching guest gender if known
- **English** (UK vs US): Spelling and idiom

### Hard rules for AI replies

- Never quote prices unless room rates exist in hotel data
- Never make commitments outside policy (free upgrades, complimentary services)
- Escalate to human if confidence < 70% or ambiguous request
- Never write in language we don't have hotel data verified in

## Channel manager strategy

### Phase 1: Aggregator
- HotelRunner / MyAllocator
- Live in days
- $30-50/mo per property
- Single API to manage all OTAs

### Phase 2: Direct integration
- Booking.com, Agoda, Airbnb each via own API
- 4-16 weeks approval
- Lower cost, more control
- More dev work to maintain

Code is structured so switching is just swapping the adapter.

## Compliance

### ทร.30

- Auto-detect foreign guests (`nationality !== 'Thai'`)
- Generate report on check-in
- Submit via API (where available) or export CSV (manual upload)
- Track confirmation numbers

### e-Tax

- Generate UBL 2.0 XML on invoice issue
- Sign with digital certificate
- Submit to provider (INET / Frank / Leceipt)
- Email signed PDF to customer

## Security

### Auth
- Supabase Auth (email/password, magic link, OAuth-ready)
- JWT in cookies, auto-refresh
- Middleware protects `/dashboard/*` and `/api/(non-public)/*`

### Authorization
- RLS policies on every tenant table
- Roles: `owner`, `admin`, `manager`, `front_desk`, `housekeeping`, `staff`
- Helper: `auth.user_organization_id()` returns current user's org

### Webhooks
- LINE: HMAC-SHA256 signature verification
- WhatsApp: SHA-256 + verify token
- Omise: signature verification
- Idempotency: check `channel_message_id` to prevent duplicates

### Data protection
- PII encrypted at rest (Supabase)
- TLS everywhere
- PDPA-compliant data retention
- Audit log for sensitive operations

## Performance

### Database
- Indexes on `hotel_id`, dates, status fields
- Generated columns: `nights`, `balance_amount`
- JSONB for flexible fields (amenities, preferences)
- Connection pooling via Supabase pgbouncer

### Realtime
- Supabase Realtime channels per active conversation
- Subscriptions cleaned up on unmount

### Caching
- Static hotel data (room types) cached aggressively
- AI responses logged for similar query reuse
- OTA API responses with short TTL

### Frontend
- Next.js App Router with React Server Components
- Static generation for marketing pages
- Streaming for slow data
- Image optimization via Next/Image

## Scaling considerations

| Scale          | Bottleneck            | Solution                           |
| -------------- | --------------------- | ---------------------------------- |
| 100 hotels     | DB connections        | Pgbouncer, connection pooling      |
| 1,000 hotels   | Read load             | Read replicas, regional caches     |
| 10K hotels     | Write throughput      | Sharding by region                 |
| 10K msg/day    | Webhook processing    | BullMQ + Redis queue               |
| Global         | Latency               | Multi-region deployment            |

## Code organization

We follow these patterns:

### Server Components by default
Pages are async server components. Use `'use client'` only where needed (state, events, browser APIs).

### Adapter pattern for integrations
```typescript
interface ChannelAdapter {
  sendMessage(params: SendParams): Promise<Result>;
  parseWebhook(req: Request): Promise<Event[]>;
}

// Implementations
export const lineAdapter: ChannelAdapter = { ... };
export const whatsappAdapter: ChannelAdapter = { ... };
```

### API routes are thin
Business logic lives in `lib/`. API routes just validate input → call lib → return response.

### Component co-location
- `app/dashboard/foo/page.tsx` — server component, data fetching
- `components/dashboard/foo-client.tsx` — interactive client component
- `lib/foo/` — business logic, types, utilities
