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
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Webhook endpoint:

- `POST /api/stripe/webhook`

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
	- Publish draw
	- Assign winner record

## Quality Checks

```bash
npm run lint
npm run build
```

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

## Notes

- Do not commit `.env.local` or credentials.
- Keep security-sensitive logic in server actions and server components.
- Use `src/lib/supabase/server.ts` for authenticated server-side database operations.
