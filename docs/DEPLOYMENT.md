# Deployment

## Recommended: Vercel + Supabase

This is the cheapest, fastest, most reliable setup for a Next.js + Supabase app.

### Step 1 · Production Supabase

```bash
# Create production project
# In Supabase dashboard: New Project → name: maitri-prod → region: Singapore

# Link locally
npx supabase link --project-ref YOUR_PROD_REF

# Push migrations
npx supabase db push
```

**Recommended Supabase settings:**
- Plan: **Pro ($25/mo)** for backups, no auto-pause
- Enable **Point-in-time recovery**
- Enable **Database backups** (daily)
- Settings → Auth → Disable "Email signups" if you want manual onboarding
- Settings → Auth → Customize email templates with Maitri branding

### Step 2 · Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:yourusername/maitri.git
git push -u origin main
```

### Step 3 · Deploy to Vercel

1. [vercel.com](https://vercel.com) → **Import Project**
2. Select your GitHub repo
3. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root directory**: `./`
   - **Build command**: `npm run build` (default)
4. **Environment Variables** — add all from `.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   LINE_CHANNEL_ACCESS_TOKEN
   LINE_CHANNEL_SECRET
   WHATSAPP_ACCESS_TOKEN
   WHATSAPP_PHONE_NUMBER_ID
   WHATSAPP_VERIFY_TOKEN
   OMISE_PUBLIC_KEY
   OMISE_SECRET_KEY
   SENDGRID_API_KEY
   SENDGRID_FROM_EMAIL
   # ... etc
   ```
5. Click **Deploy**

### Step 4 · Custom domain

1. Vercel → **Project → Settings → Domains**
2. Add your domain (e.g., `app.maitri.co`)
3. Follow DNS instructions:
   - **CNAME**: `cname.vercel-dns.com`
   - Or **A record** to Vercel's IP
4. Wait for DNS propagation (~5 min to 1 hour)
5. SSL is automatic

### Step 5 · Production webhooks

After deploy, update webhook URLs at every service:

| Service | URL |
| --- | --- |
| LINE | `https://yourdomain.com/api/webhooks/line` |
| WhatsApp | `https://yourdomain.com/api/webhooks/whatsapp` |
| Omise | `https://yourdomain.com/api/webhooks/omise` |
| Booking.com | `https://yourdomain.com/api/webhooks/booking-com` |

### Step 6 · Smoke test

Run through this checklist in production:

- [ ] Sign up creates account + organization + hotel
- [ ] Dashboard loads with no errors
- [ ] Add room type → add room → success
- [ ] Create reservation manually → folio auto-created
- [ ] LINE OA: send test message → appears in inbox
- [ ] AI suggest reply → returns relevant Thai text
- [ ] Public booking engine: book a room → confirmation email arrives
- [ ] Omise test charge → webhook updates payment status
- [ ] Check-in → check-out flow works end-to-end

---

## Alternative: Self-hosted with Docker

```dockerfile
# Dockerfile (already in repo)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t maitri .
docker run -p 3000:3000 --env-file .env.local maitri
```

For production, deploy on:
- **Fly.io** — easy, ~$5-30/mo
- **Railway** — easiest, ~$5-20/mo
- **AWS ECS** — most flexible, harder
- **DigitalOcean App Platform** — middle ground

---

## Database migrations in production

**Always use migrations**, never edit production schema manually.

```bash
# Create new migration
npx supabase migration new add_loyalty_tiers

# Edit the SQL file in supabase/migrations/
# Test locally
npx supabase db reset

# Push to production
npx supabase db push --linked
```

**Rollback:**
- Use Supabase dashboard → Database → Backups → Point-in-time restore
- Or write a down migration

---

## Monitoring

### Health check endpoint

Create `src/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ ok: true, version: process.env.npm_package_version });
}
```

### Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Uptime monitoring

[Better Stack](https://betterstack.com) or [Uptime Robot](https://uptimerobot.com):
- Monitor `/api/health`
- Alert via email + Slack on downtime
- Free tier covers basic needs

---

## Costs at scale

| Customers | Monthly bill (THB) | Per customer |
| --------- | ------------------ | ------------ |
| 10 hotels | ~฿8,000 | ฿800 |
| 30 hotels | ~฿15,000 | ฿500 |
| 100 hotels | ~฿40,000 | ฿400 |
| 500 hotels | ~฿150,000 | ฿300 |

Anthropic API is the largest variable cost. Optimize:
- Cache common translations
- Batch requests
- Use Haiku where Sonnet is overkill
- Implement smart context windowing

---

## Production checklist

Before announcing launch:

- [ ] All environment variables set in Vercel
- [ ] Supabase Pro plan active
- [ ] Custom domain configured + SSL active
- [ ] All webhooks pointing to production URLs
- [ ] Sentry capturing errors
- [ ] Daily backups confirmed
- [ ] Privacy Policy + ToS published
- [ ] PDPA compliance reviewed by lawyer
- [ ] Test data cleaned from production DB
- [ ] Load test (k6 or Artillery) passing
- [ ] Monitoring alerts configured
- [ ] Status page set up (Better Stack)
- [ ] Customer support email/LINE OA active
