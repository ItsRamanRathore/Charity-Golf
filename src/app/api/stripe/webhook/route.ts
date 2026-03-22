import Stripe from 'stripe';
import { getStripeServerClient } from '@/lib/stripe/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

type SupabaseUpdateResult = Promise<{ error: Error | null }>;

type SupabaseUpdateByColumn = {
  eq: (column: string, value: string) => SupabaseUpdateResult;
};

type SupabaseTableClient = {
  update: (payload: Record<string, unknown>) => SupabaseUpdateByColumn;
};

type LooseSupabaseClient = {
  from: (table: string) => SupabaseTableClient;
};

function toIsoFromUnix(unixTimestamp?: number | null) {
  if (!unixTimestamp) {
    return null;
  }

  return new Date(unixTimestamp * 1000).toISOString();
}

function mapStripeStatusToSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'active' | 'inactive' | 'past_due' | 'canceled' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'inactive';
  }
}

async function syncSubscriptionByCustomerId(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdminClient() as unknown as LooseSupabaseClient;

  const customerId = String(subscription.customer);
  const normalizedStatus = mapStripeStatusToSubscriptionStatus(subscription.status);
  const rawPeriodEnd = (subscription as unknown as { current_period_end?: number | null })
    .current_period_end;

  const payload = {
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
    subscription_status: normalizedStatus,
    subscription_current_period_end: toIsoFromUnix(rawPeriodEnd),
  };

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(payload)
    .eq('stripe_customer_id', customerId);

  if (error) {
    throw error;
  }
}

async function syncCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabaseAdmin = getSupabaseAdminClient() as unknown as LooseSupabaseClient;

  const userId = session.client_reference_id || session.metadata?.user_id || null;
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;

  if (!userId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const stripe = getStripeServerClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 });
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing stripe-signature', { status: 400 });
    }

    const body = await request.text();

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        await syncCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscriptionByCustomerId(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
}
