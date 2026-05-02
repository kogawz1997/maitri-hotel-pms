# Production Readiness Patch

This patch fixes the first blocking issues found in the uploaded Maitri Hotel PMS project.

## Fixed

- Added missing `src/components/booking/booking-engine.tsx`, so `/booking/[hotel]` has a real booking UI instead of a missing import.
- Added API guard helper at `src/lib/api-guards.ts` to enforce Supabase session + active user profile checks.
- Hardened `/api/auth/setup-organization` so it no longer trusts client-provided `userId` or `email`; it reads the authenticated Supabase user from the session.
- Updated signup flow to stop sending `userId`/`email` to organization setup.
- Added request validation with `zod` to reservations, booking quote, payment, e-Tax, TM30, and AI reply suggestion APIs.
- Protected staff-only APIs: reservation list/detail/update, AI suggested replies, payments, e-Tax, and TM30.
- Kept public booking creation and quote endpoints usable for the guest booking page.
- Fixed `detectLanguage` imports to use the existing utility export instead of importing a non-existent AI export.
- Added extra RLS policies in the initial migration for room, room type, folio, invoice, payment, housekeeping, and profile access.
- Added `dotenv` and `tsx` dependencies used by the demo seeding script.

## Still required before real production

- Run `npm install`, then `npm run type-check`, `npm run build`, and fix any environment-specific errors. The patch environment had no installed dependencies, so a full build could not be executed here.
- Add real webhook verification for Booking.com and Agoda before enabling them in production.
- Replace placeholder TM30/e-Tax provider logic with real provider integrations and error retry queues.
- Add rate limiting and bot protection to public booking endpoints.
- Add transactional booking creation with inventory locking to avoid overbooking under concurrent traffic.
- Add audit logs for payment, invoice, guest PII changes, check-in, check-out, and staff actions.
- Review Supabase RLS policies in a staging database before applying to existing production data.
