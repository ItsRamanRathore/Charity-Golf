'use server';

import { createClient } from '@/lib/supabase/server';
import { getStripeServerClient } from '@/lib/stripe/server';
import { redirect } from 'next/navigation';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function startCheckout() {
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

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    redirect('/dashboard/subscription?error=Missing%20STRIPE_PRICE_ID%20configuration.');
  }

  let customerId = profile?.stripe_customer_id || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/subscription?checkout=success`,
    cancel_url: `${appUrl}/dashboard/subscription?checkout=cancelled`,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
    },
  });

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
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/dashboard/subscription`,
  });

  redirect(portalSession.url);
}
