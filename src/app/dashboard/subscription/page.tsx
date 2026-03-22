import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { openBillingPortal, startCheckout } from './actions';

const statusConfig: Record<string, { label: string; color: string; bg: string; hint: string }> = {
  active: {
    label: 'Active',
    color: '#047857',
    bg: 'rgba(16, 185, 129, 0.12)',
    hint: 'Your account can participate in monthly draw qualification flows.',
  },
  past_due: {
    label: 'Past Due',
    color: '#B45309',
    bg: 'rgba(245, 158, 11, 0.14)',
    hint: 'Update payment details to restore full access.',
  },
  canceled: {
    label: 'Canceled',
    color: '#B91C1C',
    bg: 'rgba(239, 68, 68, 0.12)',
    hint: 'Reactivate to re-enter draw eligibility and premium access.',
  },
  inactive: {
    label: 'Inactive',
    color: '#334155',
    bg: 'rgba(148, 163, 184, 0.16)',
    hint: 'Activate a subscription to unlock draw participation.',
  },
};

export default async function DashboardSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, updated_at, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single();

  const subscriptionStatus = profile?.subscription_status ?? 'inactive';
  const card = statusConfig[subscriptionStatus] ?? statusConfig.inactive;

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Subscription</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
        Manage billing standing and access level for premium platform features.
      </p>

      {params.checkout === 'success' && (
        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', maxWidth: '760px' }}>
          Checkout completed. Subscription status will sync automatically after webhook delivery.
        </div>
      )}

      {params.checkout === 'cancelled' && (
        <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.14)', color: '#B45309', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', maxWidth: '760px' }}>
          Checkout was cancelled. No billing change was applied.
        </div>
      )}

      {params.error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', maxWidth: '760px' }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <div className="glass" style={{ padding: '28px', maxWidth: '760px', background: 'white' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: '999px',
            background: card.bg,
            color: card.color,
            marginBottom: '14px',
          }}
        >
          {card.label}
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>Current plan status: {card.label}</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>{card.hint}</p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <form action={startCheckout}>
            <button className="btn-primary" type="submit">Start Subscription Checkout</button>
          </form>

          <form action={openBillingPortal}>
            <button className="btn-secondary" type="submit">Open Billing Portal</button>
          </form>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Plan Tier</div>
            <div style={{ fontWeight: 700 }}>Digital Heroes Standard</div>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Billing Cycle</div>
            <div style={{ fontWeight: 700 }}>Monthly</div>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Last Profile Update</div>
            <div style={{ fontWeight: 700 }}>{profile?.updated_at ? new Date(profile.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Stripe Customer ID</div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{profile?.stripe_customer_id || 'Not created yet'}</div>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Stripe Subscription ID</div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{profile?.stripe_subscription_id || 'Not active yet'}</div>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
          Billing lifecycle is synced via Stripe webhooks into profile subscription fields.
        </p>
      </div>
    </div>
  );
}
