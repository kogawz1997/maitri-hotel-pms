# Setup Guide

This guide covers signing up for and configuring all external services Maitri uses. **Don't try to do everything at once** — start with the **Required** section to launch an MVP, then add others as needed.

---

## 🚨 Required for MVP

### 1 · Supabase (database + auth)

**What it is:** Postgres database with built-in auth, realtime, and storage.

**Steps:**
1. [supabase.com](https://supabase.com) → Sign up with GitHub (free)
2. **New Project** → Region: `Southeast Asia (Singapore)` for low latency in Thailand
3. After provisioning (~2 min), go to **Settings → API**
4. Copy these into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep this server-only)

**Migrations:**
```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

**Cost:** Free tier covers ~50K MAU. Upgrade to **Pro ($25/mo)** before production for backups and better SLA.

### 2 · Anthropic Claude

**What it is:** The AI engine for translation, replies, sentiment analysis, dynamic pricing.

**Steps:**
1. [console.anthropic.com](https://console.anthropic.com) → Sign up
2. Free $5 credit on signup (≈3,000 translations)
3. **Settings → API Keys → Create**
4. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

**Cost:** Pay as you go. Sonnet ~$3 input / $15 output per 1M tokens. Estimate ~฿3,000–8,000/mo for 30 hotels.

### 3 · Domain + Vercel

**Steps:**
1. Buy a domain (Cloudflare Registrar = cheapest, ~$10/year)
2. Push your code to GitHub (private repo)
3. [vercel.com](https://vercel.com) → Import GitHub repo
4. Configure:
   - Framework: Next.js (auto)
   - Add all environment variables from `.env.local`
5. Deploy
6. **Settings → Domains** → add your custom domain → update DNS

**Cost:** Domain ~$10/year. Vercel **Pro $20/mo** for production analytics.

---

## 💬 Communication Channels

### 4 · LINE Official Account ⭐ **Most important in Thailand**

**What it is:** The dominant messaging app in Thailand.

**Steps:**

1. **Create LINE OA**
   - Go to [manager.line.biz](https://manager.line.biz)
   - Sign up → **Create Account** (เลือกแบบฟรี)
   - Verify phone

2. **Setup Messaging API**
   - Go to [developers.line.biz](https://developers.line.biz)
   - Create Provider (e.g., "Maitri Hotels")
   - **Create new channel → Messaging API**
   - Link to your LINE OA

3. **Get credentials**
   - In your channel: **Messaging API tab**
     - **Channel access token (long-lived)** → Issue → copy → `LINE_CHANNEL_ACCESS_TOKEN`
   - In **Basic settings tab**
     - **Channel secret** → copy → `LINE_CHANNEL_SECRET`

4. **Configure webhook**
   - **Messaging API tab → Webhook URL:**
     ```
     https://yourdomain.com/api/webhooks/line
     ```
   - Toggle **Use webhook → Enabled**
   - Click **Verify** to test

5. **Disable auto-reply**
   - In LINE OA Manager: **Settings → Response settings**
   - Disable "Auto-response messages"
   - Disable "Greeting messages"
   - We want Maitri's AI to handle these

**Cost:** Free up to 5,000 broadcast msgs/mo. Premium 1,500฿/mo for 50,000 msgs. 1-on-1 replies always free.

### 5 · WhatsApp Business API

**What it is:** Used by foreign guests, especially European/Indian.

**Setup is harder than LINE.** Plan 1-3 weeks.

**Steps:**
1. [business.facebook.com](https://business.facebook.com) → Create Business Account
2. Verify business documents
3. Create app → Add WhatsApp product
4. Get phone number certified
5. Pre-approved templates required for outbound (e.g., booking confirmation)

**Easier alternative:** Use a BSP (Business Solution Provider) like 360Dialog or WATI:
- Live in 1-2 days
- ~$30-50/mo + per-message fees
- Easier template approval

**Add to `.env.local`:**
```
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=any_random_string
```

**Cost:** Free for incoming. Outbound: ~฿0.5-2 per message depending on type and country.

### 6 · WeChat Official Account

**For Chinese guests.** Hard to set up without Chinese business entity.

**Options:**
- Skip until you have many Chinese guests
- Use 360Dialog or WeChat-specific BSP
- Partner with a Chinese company

### 7 · Email (SendGrid)

**For confirmation emails, invoices, marketing.**

**Steps:**
1. [sendgrid.com](https://sendgrid.com) → Sign up (free 100 emails/day)
2. **Settings → Sender Authentication → Authenticate Domain**
3. Add DNS records to your domain
4. **Settings → API Keys → Create**
5. Add to `.env.local`:
   ```
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=hello@yourdomain.com
   ```

**Cost:** Free up to 100/day, $20/mo for 50K/mo.

---

## 🏨 Channel Manager (OTA)

### Strategy

Two paths — pick based on urgency vs cost:

| Path | Time to live | Cost | Recommended for |
| --- | --- | --- | --- |
| **Aggregator** (HotelRunner / MyAllocator) | 2-7 days | $30-50/mo per property | New hotels, fast launch |
| **Direct API** | 4-16 weeks approval | Free | Established, lower commission |

**Recommendation:** Start with aggregator. Migrate to direct after 6-12 months when you have proven volume.

### Option A · HotelRunner (recommended)

1. [hotelrunner.com](https://hotelrunner.com) → Sign up
2. Choose plan with API access (~$30-50/mo)
3. Connect your channels:
   - Booking.com (login with their credentials)
   - Agoda
   - Airbnb
   - Expedia
4. Get API key → `HOTELRUNNER_API_KEY`
5. Maitri syncs availability/rates/reservations via their API

### Option B · Direct OTA

#### Booking.com Connectivity Partner

1. [connect.booking.com](https://connect.booking.com) → Apply
2. Show technical capability (you have this — Maitri's code is ready)
3. Approval: **4-12 weeks**
4. Get test environment → develop → certify → production
5. Reservations come via XML push to `/api/webhooks/booking-com`

#### Agoda YCS

1. [partners.agoda.com](https://partners.agoda.com) → YCS Connect
2. **6-16 weeks** approval
3. REST + JSON API

#### Airbnb

1. [partners.airbnb.com](https://partners.airbnb.com) → Software Partner
2. **2-4 weeks**
3. OAuth + REST

---

## 💳 Payment Gateway

### 8 · Omise (Thai-focused)

**Why Omise:** Best PromptPay support, Thai bank cards, low local fees.

**Steps:**
1. [omise.co](https://omise.co) → Sign up
2. Submit business documents (KYC):
   - Company registration
   - Tax ID
   - Bank account
   - Photo ID of authorized person
3. **Wait 1-3 weeks** for approval
4. Once approved: **Dashboard → Developers → Keys**
5. Add to `.env.local`:
   ```
   OMISE_PUBLIC_KEY=pkey_xxxxx
   OMISE_SECRET_KEY=skey_xxxxx
   ```
6. Set webhook URL:
   ```
   https://yourdomain.com/api/webhooks/omise
   ```

**Test before approval:** Use test mode keys, test cards work without real account.

**Cost:** ~3.65% + ฿10 per credit card. ~1.65% + ฿10 for PromptPay.

### 9 · Stripe (alternative for international)

For hotels mainly serving foreign guests.

1. [stripe.com](https://stripe.com) → Sign up
2. KYC verification
3. Get keys → `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`

---

## 🇹🇭 Thai Compliance

### 10 · ทร.30 (TM30 — Foreign Guest Reporting)

**Required by law:** Report foreign guest stays to immigration within 24 hours.

**Current state in Thailand (as of 2026):**
- Bangkok has online system (extranet)
- Many provinces still require manual submission
- API access varies by province

**Steps:**
1. **Register your hotel as "สถานประกอบการที่พัก"** with Immigration in your province
   - Visit local Immigration office with hotel registration documents
   - You'll get account credentials
2. For Bangkok:
   - Use [extranet.immigration.go.th](https://extranet.immigration.go.th)
   - Maitri can generate the export file → upload via web
3. For other provinces:
   - Often manual / fax / hand delivery
   - Maitri exports CSV/PDF — you submit yourself

**Note:** Real-time API integration is planned but not universally available. We'll add automated submission as provinces roll out APIs.

### 11 · e-Tax Invoice

**Required if your VAT-registered business issues tax invoices.**

**Service Providers** (must use one approved by Revenue Department):
- **INET** — [etax.inet.co.th](https://etax.inet.co.th) — ฿3,000-10,000/mo
- **Frank.co.th** — [frank.co.th](https://frank.co.th)
- **Leceipt** — [leceipt.com](https://leceipt.com)

**Steps:**
1. Choose provider (compare pricing/UI)
2. Sign contract → submit documents (1-2 weeks)
3. Get **Digital Certificate** from approved CA (Certificate Authority)
4. Connect API:
   ```
   ETAX_PROVIDER=inet
   ETAX_USERNAME=...
   ETAX_PASSWORD=...
   ETAX_CERTIFICATE_PATH=/path/to/cert.p12
   ```
5. Test in sandbox → production

**Cost:** ฿3,000-10,000/mo + per-document fees.

### 12 · PDPA Compliance

**Personal Data Protection Act** — Thailand's GDPR.

**Required:**
- [ ] Privacy Policy (consult lawyer — ~฿15,000-30,000)
- [ ] Data Processing Agreement (DPA)
- [ ] Data retention policy
- [ ] Data Protection Officer (DPO) — designate someone

**Penalties:** Up to ฿5,000,000 + criminal liability for serious violations.

---

## 📊 Accounting

### 13 · FlowAccount

Easier API access than PEAK.

1. [flowaccount.com](https://flowaccount.com) → Sign up
2. Subscribe to plan with API access
3. **Settings → Developer → API Key** → `FLOWACCOUNT_API_KEY`

### 14 · PEAK Account

1. [peakaccount.com](https://peakaccount.com) → Sign up
2. Email support for API access (not self-serve)
3. Get credentials → `PEAK_API_KEY`

---

## 🛡️ Production Hardening

### Monitoring

- **Sentry** ([sentry.io](https://sentry.io)) — Error tracking, free tier
- **PostHog** ([posthog.com](https://posthog.com)) — Product analytics
- **Better Stack** or **Uptime Robot** — Uptime monitoring

### Security

- [ ] Enable 2FA on **every** account (Supabase, Vercel, Anthropic, etc.)
- [ ] Rotate secrets every 6 months
- [ ] Set up Supabase **point-in-time recovery** (Pro plan)
- [ ] Manual backup script for critical tables
- [ ] Configure Cloudflare in front of Vercel for DDoS protection (optional)

---

## ⏱ Recommended Timeline

| Week | Goals |
| ---- | --- |
| **1-2** | Supabase + Anthropic + Vercel + Domain. **Onboard 1 pilot hotel.** |
| **3-4** | LINE OA setup. Deploy production. |
| **5-6** | Omise approval comes through. WhatsApp via 360Dialog. |
| **7-10** | HotelRunner aggregator. Sync 2-3 OTAs. |
| **11-16** | e-Tax provider, accounting integration, Sentry. |
| **17+** | Direct OTA integrations approved one by one. Scale. |

---

## 💡 Pro Tips

1. **Don't try everything at once.** A working MVP with LINE + Email beats a broken system with 10 channels.
2. **Channel Manager is the biggest bottleneck.** Apply for direct OTA approvals on day 1, parallel to building.
3. **e-Tax is expensive.** Budget ฿100K+/year. Some hotels skip it and issue paper for first year.
4. **PDPA — talk to a lawyer early.** Penalties are huge. ฿20K consultation is cheap insurance.
5. **PromptPay is everything in Thailand.** Make sure Omise approval works before launch.
