# The Burgundy AI — v1.0

## Production hardening

This release turns the previous feature builds into a safer deployable foundation.

### Security

Admin endpoints now require:

`x-admin-secret: ADMIN_API_SECRET`

Cron endpoints require:

`x-cron-secret: CRON_SECRET`

Never put these secrets in browser code.

### Webhooks

POS webhook signatures are checked with HMAC-SHA256.

Webhook events are idempotent through the database unique key.

### Rate limiting

Admin order operations have a basic in-process rate limiter. For multi-instance production, replace it with Redis/Upstash or another shared store.

### Logging

Structured JSON logging helpers are available in `lib/logger.ts`.

### Cron

`vercel.json` schedules reservation reminders every 15 minutes.

Vercel Cron requests should be protected with a secret in a production deployment. If using Vercel's native cron authorization, adapt the cron guard to the platform's `CRON_SECRET` mechanism.

### Important deployment correction

The admin APIs are now protected. The browser dashboard itself still needs a real session/auth provider before being exposed publicly.

For an actual restaurant deployment, add NextAuth/Auth.js, Clerk, Supabase Auth or another session-based provider and enforce roles such as:

- OWNER
- MANAGER
- HOST
- KITCHEN
- CONCIERGE

### Production checklist

1. Provision PostgreSQL.
2. Set all `.env` variables in Vercel.
3. Run `npx prisma db push` or migrations.
4. Seed only verified Burgundy data.
5. Configure Meta WhatsApp webhook.
6. Configure Paystack webhook.
7. Obtain Chef Stone POS API contract/credentials.
8. Configure POS webhook.
9. Configure cron.
10. Add real staff authentication before exposing `/dashboard`.
11. Run order/payment/reservation smoke tests.
12. Turn on monitoring.

### Next build

v1.1 should add real staff authentication/RBAC, WhatsApp production webhook verification, conversation persistence/recovery, background jobs/retries and a deployment smoke-test suite.
