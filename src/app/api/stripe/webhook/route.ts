import Stripe from 'stripe';
import { getStripeServerClient } from '@/lib/stripe/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logServerError, logServerInfo, logServerWarn } from '@/lib/observability/logger';

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
  const selectedPlan = session.metadata?.plan === 'yearly' ? 'yearly' : 'monthly';

  if (!userId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_plan: selectedPlan,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const stripe = getStripeServerClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logServerError(
        'stripe.webhook.config.missing_secret',
        new Error('Missing STRIPE_WEBHOOK_SECRET'),
        { requestId }
      );
      return new Response(JSON.stringify({ error: 'Configuration error', requestId }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      logServerWarn('stripe.webhook.signature.missing', { requestId });
      return new Response(JSON.stringify({ error: 'Missing signature', requestId }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.text();

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logServerInfo('stripe.webhook.event.received', {
      requestId,
      eventId: event.id,
      eventType: event.type,
    });

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
        logServerInfo('stripe.webhook.event.ignored', {
          requestId,
          eventId: event.id,
          eventType: event.type,
        });
        break;
    }

    return new Response(JSON.stringify({ received: true, requestId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logServerError('stripe.webhook.handler.failed', error, { requestId });
    return new Response(JSON.stringify({ error: 'Webhook error', requestId }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
