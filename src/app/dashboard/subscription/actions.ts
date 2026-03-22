'use server';

import { createClient } from '@/lib/supabase/server';
import { getStripeServerClient } from '@/lib/stripe/server';
import { logServerError } from '@/lib/observability/logger';
import { redirect } from 'next/navigation';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function startCheckout(formData: FormData) {
  const supabase = await createClient();
  const stripe = getStripeServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_plan')
    .eq('id', user.id)
    .single();

  const selectedPlanRaw = String(formData.get('plan') || profile?.subscription_plan || 'monthly');
  const selectedPlan = selectedPlanRaw === 'yearly' ? 'yearly' : 'monthly';

  const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;

  const priceId = selectedPlan === 'yearly' ? yearlyPriceId : monthlyPriceId;
  if (!priceId) {
    redirect('/dashboard/subscription?error=Missing%20Stripe%20price%20configuration.');
  }

  await supabase
    .from('profiles')
    .update({ subscription_plan: selectedPlan })
    .eq('id', user.id);

  let customerId = profile?.stripe_customer_id || null;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId, subscription_plan: selectedPlan })
        .eq('id', user.id);
    } catch (error) {
      const requestId = crypto.randomUUID();
      logServerError('subscription.checkout.customer_create.failed', error, {
        requestId,
        userId: user.id,
      });
      redirect(
        `/dashboard/subscription?error=${encodeURIComponent(
          `Unable to create customer. Ref: ${requestId}`
        )}`
      );
    }
  }

  const appUrl = getAppUrl();
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/subscription?checkout=success`,
      cancel_url: `${appUrl}/dashboard/subscription?checkout=cancelled`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan: selectedPlan,
      },
    });
  } catch (error) {
    const requestId = crypto.randomUUID();
    logServerError('subscription.checkout.session_create.failed', error, {
      requestId,
      userId: user.id,
      customerId,
    });
    redirect(
      `/dashboard/subscription?error=${encodeURIComponent(
        `Unable to start checkout. Ref: ${requestId}`
      )}`
    );
  }

  if (!session.url) {
    redirect('/dashboard/subscription?error=Unable%20to%20start%20checkout.');
  }

  redirect(session.url);
}

export async function openBillingPortal() {
  const supabase = await createClient();
  const stripe = getStripeServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    redirect('/dashboard/subscription?error=No%20Stripe%20customer%20found.%20Start%20a%20subscription%20first.');
  }

  const appUrl = getAppUrl();
  let portalSession;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/subscription`,
    });
  } catch (error) {
    const requestId = crypto.randomUUID();
    logServerError('subscription.billing_portal.create.failed', error, {
      requestId,
      userId: user.id,
      customerId: profile.stripe_customer_id,
    });
    redirect(
      `/dashboard/subscription?error=${encodeURIComponent(
        `Unable to open billing portal. Ref: ${requestId}`
      )}`
    );
  }

  redirect(portalSession.url);
}
