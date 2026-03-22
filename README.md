# Digital Heroes

Digital Heroes is a Next.js 16 application for golf-score tracking, monthly draw participation, and charity impact visibility.

## Tech Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Supabase (auth + database)
- ESLint 9

## Production-Ready Folder Layout

```text
database/
	schema.sql
public/
src/
	app/
	components/
	lib/
		supabase/
			proxy.ts
			public.ts
			server.ts
	proxy.ts
```

## Setup

1. Copy environment template:

```bash
cp .env.example .env.local
```

2. Fill required values in `.env.local`.

3. Install dependencies:

```bash
npm install
```

4. Start development server:

```bash
npm run dev
```

## Database

- Canonical schema location: `database/schema.sql`
- Versioned migrations: `database/migrations/`
- Apply schema to your Supabase/Postgres instance using your preferred migration workflow.

### Migration Workflow

1. Add a new SQL file under `database/migrations/` with a sortable timestamp prefix.
2. Keep all RLS/policy adjustments additive and idempotent (`DROP POLICY IF EXISTS`, `CREATE POLICY`).
3. Apply migration in staging first, then production.
4. Verify dashboard auth and protected routes after each migration.

Latest hardening migration:

- `database/migrations/20260322_phase2_security_hardening.sql`
- `database/migrations/20260322_phase2_billing_profile_fields.sql`

## Billing (Stripe)

Required environment variables:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_YEARLY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional email notifications (winner review and payout updates):

- `RESEND_API_KEY`
- `NOTIFICATIONS_FROM_EMAIL`

Webhook endpoint:

- `POST /api/stripe/webhook`

Health endpoint:

- `GET /api/health`

During local development, forward Stripe events to this endpoint and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

### Local Stripe Setup (All 3 Steps)

1. Set all billing env variables in `.env.local`:
	- `STRIPE_SECRET_KEY`
	- `STRIPE_WEBHOOK_SECRET`
	- `STRIPE_PRICE_ID`
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `NEXT_PUBLIC_APP_URL`

2. Forward webhook events to local app and copy generated secret:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Create a recurring price and copy resulting `price_...` into `STRIPE_PRICE_ID`:

```bash
stripe products create --name "Digital Heroes Standard"
stripe prices create --unit-amount 1999 --currency usd --recurring interval=month --product <prod_id>
```

## Admin Operations

- Admin draw management route: `/dashboard/admin/draws`
- Admin-only actions supported:
	- Create draw
	- Simulate draw payout split
	- Publish draw
	- Assign winner record
	- Jackpot rollover when no 5-match winner
- Additional admin routes:
	- `/dashboard/admin/users`
	- `/dashboard/admin/charities`
	- `/dashboard/admin/winners`
	- `/dashboard/admin/reports`

## PRD Feature Coverage (Implemented)

- Monthly and yearly subscription plans
- Rolling 5-score retention + score editing
- Charity search/filter + profile pages + spotlight section
- Independent donation record flow
- Winner proof submission + admin approve/reject + payout state updates
- Draw simulation mode + pool tier split summary + rollover handling
- User and admin dashboards with role-specific modules

### Admin Login Troubleshooting

If login shows `Invalid login credentials`, use this checklist:

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`.
2. Upsert/reset admin account and force role to `admin`:

```bash
npm run admin:upsert -- --email admin@example.com --password "YourStrongPass123!" --name "Admin User"
```

3. Sign in at `/auth/login` with that email/password.
4. Verify admin route access at `/dashboard/admin/draws`.

If the email exists but was unverified or had old credentials, the command above updates password and sets `email_confirm=true`.

If signup/admin creation fails with `Database error saving new user`, apply migration `database/migrations/20260322_fix_auth_profiles_trigger.sql` in Supabase SQL Editor, then rerun `npm run admin:upsert`.

## Quality Checks

```bash
npm run lint
npm run build
```

## Complete Website Testing Workflow

Follow this sequence to validate the full product from local setup to payment, admin, and performance.

### 1. Environment Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill all required values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL` (local: `http://localhost:3000`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

3. Install dependencies and run app:

```bash
npm ci
npm run dev
```

4. Confirm app health endpoint:

- Open `/api/health`
- Expect HTTP 200 with JSON health payload

### 2. Stripe Local Testing Setup

1. Install Stripe CLI and login.
2. Start webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copy generated `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.
4. Trigger a test event:

```bash
stripe trigger checkout.session.completed
```

### 3. Core Functional Testing (User Journey)

1. Signup: `/auth/signup`
2. Login: `/auth/login`
3. Dashboard overview: `/dashboard`
4. Submit score: `/dashboard/scores`
5. Select charity: `/dashboard/charity`
6. Start checkout: `/dashboard/subscription`
7. Confirm draw access: `/dashboard/draws`

Expected results:

- No route hangs beyond timeout guard
- Subscription status updates after webhook events
- Draw access reflects active vs inactive subscription state

### 4. Admin Workflow Testing

1. Login as admin user
2. Open `/dashboard/admin/draws`
3. Create a draw
4. Publish the draw
5. Assign winner

Expected results:

- Admin page loads quickly and lists recent draws
- New draw appears with correct status transitions
- Winner row is created with selected user and prize details

### 5. Slow Rendering Verification

Use this exact checklist after starting local server.

1. Open browser DevTools Network tab.
2. Hard refresh home page and verify:

- First load is not blocked by external Google font CSS
- Navbar and footer no longer require client-side hydration for hover states
- Charity fallback images load from local static files instead of remote placeholders

3. Test route response speed:

- `/`
- `/charities`
- `/dashboard`
- `/dashboard/scores`
- `/dashboard/admin/draws`

4. If still slow, confirm external services:

- Supabase project region latency
- Stripe API response latency
- Local machine CPU load during dev mode

### 6. Pre-Deploy Gate

Run before every release:

```bash
npm run lint
npm run check:migrations
npm run build
```

Only deploy if all three commands pass.

## CI/CD and Deployment (Phase 4b)

This repository includes two GitHub Actions workflows:

- CI validation: `.github/workflows/ci.yml`
- Production deployment to Vercel: `.github/workflows/deploy.yml`

### Required GitHub Secrets

Configure these in your GitHub repository settings.

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Also configure production app secrets in Vercel project settings.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

### Deployment Flow

1. Push to `main` or `master`.
2. GitHub Actions runs lint, migration checks, and production build.
3. If checks pass, workflow deploys prebuilt artifacts to Vercel production.

Before first production deploy, apply all migrations under `database/migrations/` to your Supabase project.

## Monitoring and Hardening (Phase 4c)

- Security headers are enforced in `next.config.ts` (CSP, HSTS, COOP/CORP, frame protections).
- Structured server logs are emitted from webhook, subscription, and admin draw actions.
- Sensitive log fields (keys/tokens/password-like values) are redacted at logger level.
- `GET /api/health` can be used by uptime monitors for basic service liveness checks.

## Notes

- Do not commit `.env.local` or credentials.
- Keep security-sensitive logic in server actions and server components.
- Use `src/lib/supabase/server.ts` for authenticated server-side database operations.

### Windows EPERM Dev Error Fix

If you see:

`EPERM: operation not permitted, rename ... .next ... _buildManifest.js.tmp ...`

Use this sequence:

1. Stop all running Next dev servers.
2. Delete `.next` folder.
3. Start stable dev mode:

```bash
npm run dev:stable
```

The `dev:stable` script runs webpack mode (`next dev --webpack`), which is more reliable for Windows file-lock scenarios.
