# Digital Heroes

Digital Heroes is a full-stack web platform where users track golf scores, participate in draw-based rewards, and support charities through subscriptions and donations.

This project is assignment-ready with role-based dashboards, Stripe billing, Supabase auth and database integration, and Vercel deployment workflow.

## 1. Project Highlights

- Role-based authentication with user and admin access paths
- User dashboard with score tracking, draw participation, subscription, winnings, and charity selection
- Admin dashboard with modules for draws, winners, users, charities, and reports
- Stripe checkout and webhook-driven subscription synchronization
- Charity explorer with list, search, filters, spotlight, and profile detail pages
- Winner proof submission and admin review (approve or reject) workflow
- Draw simulation and rollover support
- Health endpoint and CI/CD deployment workflow for production readiness
- India-first display defaults (INR formatting and IST-oriented product behavior)

## 2. Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Supabase (Auth, Postgres, RLS)
- Stripe (Checkout, webhook)
- ESLint 9
- GitHub Actions + Vercel

## 3. Implemented Features (Assignment Scope)

### 3.1 Authentication and Access Control

- Email and password signup/login
- Secure logout
- Role-aware dashboard navigation and admin tools visibility
- Protected dashboard routes via middleware and server-side checks

### 3.2 User Experience

- Dashboard overview with profile and summary metrics
- Golf score submission and score editing
- Rolling retention of most recent scores
- Draws page with participation-oriented view
- Winnings page with proof upload/submit flow
- Charity management page for selecting or changing supported cause
- Subscription page supporting plan-based checkout

### 3.3 Admin Experience

- Admin home with quick actions
- Draw management: create, simulate, publish, and winner assignment
- Winner review and payout status management
- User management view
- Charity management view
- Reporting view for platform-level visibility

### 3.4 Charity Module

- Public charities listing page
- Search and featured filtering
- Spotlight section
- Dynamic charity profile pages at /charities/[id]

### 3.5 Billing and Payments

- Stripe Checkout integration
- Monthly and yearly price support
- Webhook endpoint to sync subscription lifecycle updates
- Optional billing portal support in user subscription flow

### 3.6 Reliability and Security

- Query timeout wrapper for controlled fallback behavior
- Security headers in Next config
- Structured server logging and sensitive-field redaction
- Health endpoint at /api/health

## 4. Route Map

### Public Routes

- /
- /about
- /charities
- /charities/[id]
- /draws
- /privacy
- /terms
- /auth/login
- /auth/signup

### User Dashboard Routes

- /dashboard
- /dashboard/scores
- /dashboard/draws
- /dashboard/winnings
- /dashboard/charity
- /dashboard/subscription

### Admin Dashboard Routes

- /dashboard/admin
- /dashboard/admin/draws
- /dashboard/admin/winners
- /dashboard/admin/users
- /dashboard/admin/charities
- /dashboard/admin/reports

### API Routes

- /api/health
- /api/stripe/webhook

## 5. Project Structure

```text
.
├─ database/
│  ├─ schema.sql
│  └─ migrations/
├─ public/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  │  ├─ performance/
│  │  ├─ notifications/
│  │  ├─ observability/
│  │  ├─ stripe/
│  │  └─ supabase/
│  └─ utils/
├─ scripts/
├─ .github/workflows/
└─ README.md
```

## 6. Local Setup Guide

### 6.1 Prerequisites

- Node.js 20+
- npm 10+
- Supabase project
- Stripe account and Stripe CLI (for local webhook testing)

### 6.2 Install and Run

1. Clone repository.
2. Install dependencies.
3. Create local env file from template.
4. Run development server.

```bash
npm install
copy .env.example .env.local
npm run dev
```

If Windows file locking causes .next EPERM issues, use stable mode:

```bash
npm run dev:stable
```

## 7. Environment Variables

Copy values into .env.local for development and into Vercel Project Settings for production.

### 7.1 Required Core Variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
- NEXT_PUBLIC_APP_URL

### 7.2 Required Stripe Variables

- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID
- STRIPE_PRICE_ID_MONTHLY
- STRIPE_PRICE_ID_YEARLY

### 7.3 Optional Notification Variables

- RESEND_API_KEY
- NOTIFICATIONS_FROM_EMAIL

## 8. Database and Migrations

### 8.1 Canonical SQL Files

- database/schema.sql
- database/migrations/20260322_fix_auth_profiles_trigger.sql
- database/migrations/20260322_phase2_security_hardening.sql
- database/migrations/20260322_phase2_billing_profile_fields.sql
- database/migrations/20260322_prd_feature_expansion.sql

### 8.2 Apply Migrations

Run all migration files in order on your Supabase database before production deployment.

Recommended order:

1. 20260322_fix_auth_profiles_trigger.sql
2. 20260322_phase2_security_hardening.sql
3. 20260322_phase2_billing_profile_fields.sql
4. 20260322_prd_feature_expansion.sql

## 9. Stripe Setup Guide

1. Create product and monthly or yearly recurring prices in Stripe.
2. Set STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_YEARLY.
3. Set STRIPE_PRICE_ID to your default plan id.
4. Start Stripe webhook forwarding locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

5. Copy generated signing secret into STRIPE_WEBHOOK_SECRET.
6. Trigger test event:

```bash
stripe trigger checkout.session.completed
```

## 10. Admin Bootstrap Guide

Use the admin upsert script if admin credentials are missing or invalid.

```bash
npm run admin:upsert -- --email admin@example.com --password "YourStrongPass123!" --name "Admin User"
```

After command completion:

1. Login at /auth/login
2. Open /dashboard/admin
3. Confirm access to /dashboard/admin/draws

## 11. Testing Checklist (Submission Validation)

### 11.1 Functional Flow

1. Signup and login
2. Enter score on /dashboard/scores
3. Select charity on /dashboard/charity
4. Start subscription from /dashboard/subscription
5. Confirm dashboard and draw route behavior
6. Submit winnings proof from /dashboard/winnings
7. Validate charity listing and profile pages

### 11.2 Admin Flow

1. Create draw
2. Simulate payout
3. Publish draw
4. Assign winner
5. Review winner request and update payout status

### 11.3 Quality Gates

Run before final submission:

```bash
npm run lint
npm run check:migrations
npm run build
```

## 12. Deployment to Vercel

### 12.1 GitHub Workflows Included

- .github/workflows/ci.yml
- .github/workflows/deploy.yml

### 12.2 Required GitHub Secrets

- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

### 12.3 Required Vercel Environment Variables

Set all required variables listed in Section 7.

### 12.4 Deployment Steps

1. Push to main or master
2. CI workflow runs lint, migration checks, and build
3. Deploy workflow pushes artifact to Vercel production
4. Verify /api/health and payment webhook behavior in production

## 13. Assignment Submission Notes

- This repository is structured for evaluator-friendly setup and validation
- Feature modules are split by user and admin responsibilities
- Production build currently compiles successfully
- Do not commit .env.local or any secret values

## 14. Available Scripts

```bash
npm run dev
npm run dev:stable
npm run build
npm run start
npm run lint
npm run check:migrations
npm run admin:upsert
```

## 15. Troubleshooting

### 15.1 Missing Supabase Environment Variables

- Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are present in .env.local
- Restart dev server after editing env values

### 15.2 Invalid Admin Login

- Run admin upsert script again
- Confirm SUPABASE_SERVICE_ROLE_KEY is correct
- Ensure migration 20260322_fix_auth_profiles_trigger.sql is applied

### 15.3 Windows EPERM During Development

- Stop running dev servers
- Remove .next folder
- Start with npm run dev:stable
