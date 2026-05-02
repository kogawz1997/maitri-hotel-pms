# API Integrations

Reference guide for every external API Maitri talks to.

---

## LINE Messaging API

**Use case:** #1 messaging app in Thailand. Most Thai customers contact via LINE.

### Setup
See [SETUP_TODO.md § 4](./SETUP_TODO.md#4--line-official-account).

### Webhook
- **URL:** `https://yourdomain.com/api/webhooks/line`
- **Headers:** `x-line-signature: <HMAC-SHA256>`
- **Verification:** HMAC of body using channel secret

### Message types supported
| Type | Status | Notes |
| --- | --- | --- |
| Text | ✅ Full | Translates automatically |
| Image | ✅ Full | Stored in Supabase Storage |
| Sticker | ✅ Maps to `[sticker]` placeholder |
| Location | ✅ `[location: lat, lng]` |
| Voice | ⚠️ Stub — needs binary download from LINE |
| Video | ⚠️ Stub — large files |

### Sample webhook payload
```json
{
  "events": [{
    "type": "message",
    "replyToken": "0f3779fba3b349968c5d07db31eabf65",
    "source": { "type": "user", "userId": "U123..." },
    "timestamp": 1462629479859,
    "message": { "type": "text", "id": "325708", "text": "Hello" }
  }]
}
```

### Send message
```typescript
await lineAdapter.sendMessage({
  channelUserId: 'U123...',
  type: 'text',
  text: 'สวัสดีค่ะ',
});
```

### Rate limits
- 500 messages/sec push
- Free tier: 1,000 broadcasts/month
- Premium 1,500฿/mo: 50,000 broadcasts/month

---

## WhatsApp Business API (Meta)

**Use case:** Foreign guests, especially European, Indian, Middle Eastern.

### Setup
See [SETUP_TODO.md § 5](./SETUP_TODO.md#5--whatsapp-business-api).

### Webhook
- **URL:** `https://yourdomain.com/api/webhooks/whatsapp`
- **Verification:** GET request with `hub.challenge` (Meta does this on setup)
- **Body verification:** SHA-256 signature

### Templates required
WhatsApp requires pre-approved templates for outbound messages outside 24-hour window:

```
booking_confirmation:
  "Hello {{1}}, your booking at {{2}} is confirmed! 
   Check-in: {{3}}, Reservation: {{4}}"
```

Approval takes 1-3 days from Meta.

### Send template
```typescript
await whatsappAdapter.sendTemplate({
  channelUserId: '+66812345678',
  templateName: 'booking_confirmation',
  variables: { 
    1: 'John', 2: 'Lanna Hotel', 
    3: '15 Mar 2026', 4: 'BK1234' 
  },
});
```

---

## Anthropic Claude API

### Models in use

| Model | Use | Cost (per 1M tokens) |
| --- | --- | --- |
| `claude-3-5-sonnet-20241022` | Translation, replies, pricing | $3 in / $15 out |
| `claude-3-5-haiku-20241022` | Sentiment, classification | $0.25 in / $1.25 out |

### Translation example
```typescript
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

const result = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Translate from Thai to Japanese, using polite keigo: "เช็คอินกี่โมงคะ"`
  }],
});
// → "チェックインは何時からでしょうか？"
```

### Cost optimization
- Cache common translations (greetings, FAQ answers)
- Use Haiku for simple tasks (sentiment, intent classification)
- Batch related queries
- Reuse system prompts across requests

---

## Omise (Payments)

### Test cards
| Number | Result |
| --- | --- |
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| `4000 0000 0000 0010` | 3-D Secure required |

### PromptPay flow
```typescript
// 1. Create charge
const charge = await omise.charges.create({
  amount: 150000, // 1,500 THB in satang
  currency: 'thb',
  source: { type: 'promptpay' },
});

// 2. Show QR to customer
console.log(charge.source.scannable_code.image.download_uri);

// 3. Webhook fires when paid
// POST /api/webhooks/omise → event.key === 'charge.complete'
```

### Webhook events handled
- `charge.complete` — Charge succeeded
- `charge.expire` — Customer didn't pay in time
- `refund.create` — Refund processed

---

## Channel Manager APIs

### HotelRunner (recommended aggregator)

```
POST https://hotelrunner.com/api/v2/inventory/bulk
Authorization: Bearer YOUR_TOKEN

[
  {
    "hotel_id": "...",
    "room_type_id": "DLX",
    "date": "2026-03-15",
    "rate": 2500,
    "available": 3,
    "stop_sell": false
  }
]
```

Reservations come via webhook to `/api/webhooks/hotelrunner`.

### Booking.com (direct, requires partner approval)

Format: **OTA_HotelResNotifRQ** (XML)

```xml
<OTA_HotelResNotifRQ Version="1.0">
  <HotelReservations>
    <HotelReservation>
      <ResGuests>
        <ResGuest>
          <Profiles>
            <ProfileInfo>
              <Profile>
                <Customer>
                  <PersonName>
                    <GivenName>John</GivenName>
                    <Surname>Smith</Surname>
                  </PersonName>
                </Customer>
              </Profile>
            </ProfileInfo>
          </Profiles>
        </ResGuest>
      </ResGuests>
      <RoomStays>...</RoomStays>
      <ResGlobalInfo>...</ResGlobalInfo>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResNotifRQ>
```

Send availability:
```xml
<OTA_HotelAvailNotifRQ>
  <AvailStatusMessages>
    <AvailStatusMessage>
      <StatusApplicationControl Start="2026-03-15" End="2026-03-15"/>
      <RestrictionStatus Status="Open"/>
    </AvailStatusMessage>
  </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>
```

### Agoda YCS (REST + JSON)

```
POST /v2/inventory
Authorization: Basic <base64>

{
  "hotelId": "12345",
  "roomTypeId": "DLX",
  "date": "2026-03-15",
  "rate": 2500,
  "available": 3
}
```

---

## e-Tax Invoice (INET example)

### Workflow
1. Generate invoice in DB
2. Build UBL 2.0 XML
3. Sign with digital certificate
4. Submit to provider API
5. Receive signed PDF + reference number
6. Email to customer

### XML structure (simplified)
```xml
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>INV-2026-001</ID>
  <IssueDate>2026-03-15</IssueDate>
  <AccountingSupplierParty>
    <Party>
      <PartyTaxScheme>
        <CompanyID>0123456789012</CompanyID>
      </PartyTaxScheme>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>...</AccountingCustomerParty>
  <InvoiceLine>...</InvoiceLine>
  <TaxTotal>
    <TaxAmount currencyID="THB">98.13</TaxAmount>
  </TaxTotal>
  <LegalMonetaryTotal>
    <PayableAmount currencyID="THB">1500.00</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>
```

Implementation in `src/lib/compliance/index.ts`.

---

## Webhook security pattern

All webhook handlers follow this pattern:

```typescript
export async function POST(req: Request) {
  // 1. Read raw body (needed for signature verification)
  const body = await req.text();
  
  // 2. Verify signature
  const signature = req.headers.get('x-signature');
  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 3. Idempotency check
  const event = JSON.parse(body);
  const exists = await checkProcessed(event.id);
  if (exists) return Response.json({ ok: true });
  
  // 4. Process (or queue for background)
  await processEvent(event);
  
  // 5. Return quickly (most providers expect < 5s)
  return Response.json({ ok: true });
}
```

---

## Rate limits to know

| Service | Limit | Mitigation |
| --- | --- | --- |
| LINE Messaging push | 500 msg/sec | Queue + batch |
| LINE broadcast | 1K-50K/mo by tier | Plan campaigns |
| WhatsApp | Tier-based, scales with quality | Use templates |
| Anthropic Sonnet | 50 req/min (free) | Upgrade tier or queue |
| Omise | 30 req/sec | Rare to hit |
| Supabase Postgres | Connections = pool size × 2 | pgbouncer |
| Booking.com push | XML messages serialized | Rate limit ourselves |

---

## Testing webhooks locally

### Using ngrok
```bash
# Terminal 1: dev server
npm run dev

# Terminal 2: tunnel
ngrok http 3000

# Use the https://abc123.ngrok.io URL in webhook config
# Note: free ngrok URLs change each restart
```

### Using Cloudflare Tunnel (free, persistent)
```bash
cloudflared tunnel --url http://localhost:3000
```

### Sending test events
- LINE: Use Webhook Tester in developer console
- WhatsApp: Send from your test phone
- Omise: Use Dashboard → Webhooks → Send test event
- Generic: `curl -X POST https://yoururl/api/webhooks/x -d '{...}'`

---

## Debugging tips

### Check Supabase logs
- Supabase Dashboard → Logs → Postgres / API logs
- Filter by error level
- Look for RLS policy violations (common!)

### Check Vercel logs
- Vercel Dashboard → Project → Functions tab
- Click any execution to see logs
- Real-time tail: `vercel logs --follow`

### Replay a webhook
Save the request body to a file when debugging, then replay:
```bash
curl -X POST http://localhost:3000/api/webhooks/line \
  -H "x-line-signature: <signature>" \
  -d @webhook-payload.json
```
