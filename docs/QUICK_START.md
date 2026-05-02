# Quick Start

Get Maitri running locally in **30 minutes**.

## Prerequisites

- **Node.js 20+** ([download](https://nodejs.org))
- **Git**
- A code editor (VS Code recommended)

## Step 1 · Install (3 min)

```bash
git clone https://github.com/yourusername/maitri.git
cd maitri
npm install
```

## Step 2 · Sign up for Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) → **Sign up with GitHub**
2. **New Project**:
   - Name: `maitri-dev`
   - Region: **Singapore** (closest to Thailand)
   - Database password: save this somewhere safe
3. Wait ~2 minutes for provisioning
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret)

## Step 3 · Sign up for Anthropic (3 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up — you'll get **$5 free credit**
3. **Settings → API Keys → Create new key**
4. Copy the key (starts with `sk-ant-...`)

## Step 4 · Configure environment (2 min)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...
ANTHROPIC_API_KEY=sk-ant-xxxxx...
```

## Step 5 · Run database migrations (3 min)

**Option A — via Supabase CLI (recommended):**

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

**Option B — via Supabase dashboard:**

1. Go to your project → **SQL Editor**
2. Open `supabase/migrations/00001_initial_schema.sql` from this repo
3. Copy entire contents → paste into SQL Editor → **Run**

## Step 6 · Start dev server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7 · Create your account (5 min)

1. Click **"เริ่มต้นฟรี"** (Get started free)
2. Fill in:
   - Hotel name (e.g., "Lanna Heritage Hotel")
   - Your name
   - Email
   - Password (8+ chars)
3. You'll land on the dashboard

## Step 8 · Set up rooms (5 min)

1. Go to **ห้อง** (Rooms) in the sidebar
2. **เพิ่มประเภท** (Add type):
   - Name: "Deluxe"
   - Code: "DLX"
   - Max occupancy: 2
   - Base rate: 2500
3. **เพิ่มห้อง** (Add room):
   - Number: "101"
   - Type: Deluxe
4. Repeat for a few more rooms

## Step 9 · Test the inbox (3 min)

To test the AI inbox without setting up LINE/WhatsApp yet, manually create a conversation:

1. Open Supabase dashboard → **Table Editor**
2. Insert into `conversations`:
   ```
   hotel_id: (copy from hotels table)
   channel: webchat
   channel_user_id: test-user-001
   guest_language: en
   guest_name: Test Guest
   status: open
   ```
3. Insert into `messages`:
   ```
   conversation_id: (from conversations above)
   direction: inbound
   sender_type: guest
   original_text: "Hello, do you have rooms tomorrow?"
   original_language: en
   message_type: text
   ```
4. Back in Maitri → **Inbox** → click the conversation
5. Click the ✨ sparkle icon to get an AI suggested reply

---

## Next Steps

You're up and running locally. To launch in production:

- [ ] **`docs/SETUP_TODO.md`** — sign up for LINE OA, WhatsApp, Channel Manager, etc.
- [ ] **`docs/DEPLOYMENT.md`** — deploy to Vercel
- [ ] **`docs/API_INTEGRATIONS.md`** — webhook setup details

## Troubleshooting

**"Cannot connect to Supabase"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (no trailing slash)
- Check that the Supabase project isn't paused (free tier auto-pauses after 7 days inactive)

**"AI not responding"**
- Verify `ANTHROPIC_API_KEY` starts with `sk-ant-`
- Check browser DevTools → Network tab for `/api/ai/*` errors
- Check Anthropic console for API usage / rate limits

**"Build error: Cannot find module"**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

**"Database push failed"**
- Make sure you ran `supabase login` first
- Try Option B in Step 5 (paste SQL directly)
