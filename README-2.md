<div align="center">

# Maitri

**The hospitality operating system for modern Thai hotels.**

AI-first property management with multi-language guest communication, channel manager, Thai compliance (ทร.30 + e-Tax), and a beautiful operator experience.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Anthropic-Claude_3.5-D97757?style=flat-square)](https://anthropic.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

[Documentation](./docs) · [Quick Start](./docs/QUICK_START.md) · [Architecture](./docs/ARCHITECTURE.md) · [Setup Guide](./docs/SETUP_TODO.md)

</div>

---

## Why Maitri

Most hotel software is built for chains and Western markets. Thai mid-market hotels — boutique, pool villa, hostel, serviced apartment — get neglected, stuck with either expensive enterprise systems or fragmented free tools that don't speak Thai or handle ทร.30.

Maitri is built specifically for the way Thai hotels work today:

- **Multi-language by default.** LINE, WhatsApp, WeChat, Email — one inbox, AI translates and responds in 14 languages with cultural awareness (keigo for Japanese, formal Mandarin for business guests, etc.).
- **Channel-flexible.** Start fast with HotelRunner aggregator (live in days), graduate to direct OTA APIs (Booking.com, Agoda, Airbnb) when ready.
- **Thai compliance native.** ทร.30 generation for foreign guests, e-Tax invoice (UBL 2.0 XML) for the Revenue Department, integrations with PEAK / FlowAccount.
- **Boutique aesthetic, operator-grade UX.** Designed like Linear or Cal.com, not like 2008 PMS software.

---

## Features

### Phase 1 · Foundation (shipped)

- **AI Multi-language Inbox** — Realtime conversations across LINE, WhatsApp, WeChat, Email. Auto-translate, AI-suggested replies with confidence scoring, escalation rules.
- **Reservations** — Calendar grid + list views, drag-friendly status, automatic folio creation, source tracking.
- **Rooms & Room Types** — Full CRUD, status management (available, occupied, cleaning, maintenance), pricing per type.
- **Public Booking Engine** — 4-step wizard, mobile-first, branded per hotel.
- **Housekeeping** — Kanban board (pending → in progress → completed), priority levels, auto-task on check-out.
- **Guest CRM** — Search, VIP tracking, loyalty tier, lifetime revenue.
- **Thai Compliance** — ทร.30 reports, e-Tax invoice (UBL 2.0), VAT handling.
- **Payments** — Omise integration with PromptPay QR, credit cards, refunds.
- **Channel Manager** — Booking.com, Agoda, Airbnb, Expedia, Trip.com adapters (stubs ready for partner approval).
- **Reports** — Revenue, ADR, RevPAR, occupancy, channel mix with Recharts.

### Phase 2 · Optimization (Q3 2026)

- Dynamic pricing AI (Claude-powered demand forecasting)
- F&B POS (charge to room, multi-outlet)
- Spa booking (therapists, services, commission tracking)
- Loyalty program (tiers, points, automated benefits)
- Email/SMS marketing campaigns
- Review aggregation & response

### Phase 3 · Scale (Q4 2026+)

- Multi-property management
- Group reservations
- Corporate accounts
- Advanced analytics & forecasting
- Mobile apps (operator + guest)
- API for third-party integrations

---

## Tech Stack

| Layer        | Choice                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| Frontend     | Next.js 15 (App Router), React 18, TypeScript                                   |
| Styling      | Tailwind CSS, Radix UI, custom design system (Fraunces + Inter)                 |
| Backend      | Next.js API routes, Supabase (Postgres + Auth + Realtime + Storage)             |
| AI           | Anthropic Claude 3.5 Sonnet (translation, replies, pricing) + Haiku (sentiment) |
| Charts       | Recharts                                                                        |
| Animation    | Framer Motion                                                                   |
| Notifications| Sonner                                                                          |
| Forms        | React Hook Form + Zod                                                           |
| Deployment   | Vercel (recommended) + Supabase Cloud                                           |

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/yourusername/maitri.git
cd maitri
npm install

# 2. Setup environment
cp .env.example .env.local
# Fill in Supabase + Anthropic credentials

# 3. Run database migrations
npx supabase link --project-ref YOUR_REF
npx supabase db push

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — full setup walkthrough in [`docs/QUICK_START.md`](./docs/QUICK_START.md).

---

## Project Structure

```
.
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (marketing)/         # Public pages (landing, pricing)
│   │   ├── auth/                # Login, signup
│   │   ├── booking/[hotel]/     # Public booking engine
│   │   ├── dashboard/           # Operator dashboard (protected)
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── ui/                  # Design system primitives
│   │   ├── layout/              # Sidebar, top-bar, mobile-nav
│   │   ├── inbox/               # Multi-channel inbox
│   │   ├── reservation/         # Calendar + list views
│   │   ├── dashboard/           # Page-specific clients
│   │   └── booking/             # Public booking wizard
│   ├── lib/
│   │   ├── ai/                  # Claude integration
│   │   ├── channels/            # LINE, WhatsApp, WeChat, Email adapters
│   │   ├── channel-manager/     # OTA integration (HotelRunner, direct)
│   │   ├── payments/            # Omise, Stripe
│   │   ├── compliance/          # ทร.30, e-Tax
│   │   ├── accounting/          # PEAK, FlowAccount
│   │   └── supabase/            # DB client (server + client)
│   └── middleware.ts            # Auth protection
├── supabase/
│   └── migrations/              # SQL schema (~40 tables, RLS enabled)
└── docs/                        # Setup guides, architecture, API docs
```

---

## Cost to Run

| Item               | Per month      |
| ------------------ | -------------- |
| Vercel Pro         | ฿700           |
| Supabase Pro       | ฿900           |
| Anthropic API      | ฿3,000–8,000   |
| LINE Messaging     | Free up to 5K msgs |
| Domain + Email     | ฿500           |
| **Total (small)**  | **~฿5,300–12,300** |

At 30 customers × ฿5,500 ARPU = ฿165,000 MRR → **~95% gross margin**.

---

## Roadmap

- [x] Phase 1 foundation (Inbox, Reservations, Rooms, Compliance, Payments, Booking Engine)
- [x] Brand identity & UI polish
- [ ] Beta launch with 5 pilot hotels (Q2 2026)
- [ ] Phase 2 features (dynamic pricing, F&B, Spa) (Q3 2026)
- [ ] Direct OTA integrations approved (Q3-Q4 2026)
- [ ] Multi-property + group features (2027)

---

## Contributing

We're not yet accepting public contributions but if you're a hotelier or developer interested in the project, [open an issue](https://github.com/yourusername/maitri/issues) or reach out.

---

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">
<sub>Made with care for Thai hospitality. 🇹🇭</sub>
</div>
