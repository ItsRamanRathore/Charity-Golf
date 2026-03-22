'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type CharityUpdatePayload = {
  charityId: string;
  charityPercentage: number;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return { supabase, user };
}

function parseCharityUpdate(formData: FormData): CharityUpdatePayload {
  const charityId = String(formData.get('charityId') || '');
  const charityPercentage = Number.parseInt(String(formData.get('charityPercentage') || ''), 10);

  if (!charityId || !Number.isInteger(charityPercentage) || charityPercentage < 10 || charityPercentage > 100) {
    throw new Error('Invalid charity update payload');
  }

  return { charityId, charityPercentage };
}

export async function updateCharitySelection(formData: FormData) {
  const { supabase, user } = await requireUser();

  let payload: CharityUpdatePayload;
  try {
    payload = parseCharityUpdate(formData);
  } catch {
    redirect('/dashboard/charity?error=Invalid%20charity%20selection');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      charity_id: payload!.charityId,
      charity_percentage: payload!.charityPercentage,
    })
    .eq('id', user.id);

  if (error) {
    redirect(`/dashboard/charity?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/charity?success=Charity%20selection%20updated');
}

export async function createIndependentDonation(formData: FormData) {
  const { supabase, user } = await requireUser();

  const charityId = String(formData.get('charityId') || '');
  const amount = Number.parseFloat(String(formData.get('amount') || ''));

  if (!charityId || Number.isNaN(amount) || amount <= 0) {
    redirect('/dashboard/charity?error=Invalid%20donation%20payload');
  }

  const { error } = await supabase.from('donations').insert({
    user_id: user.id,
    charity_id: charityId,
    amount,
    status: 'paid',
  });

  if (error) {
    redirect(`/dashboard/charity?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/charity?success=Donation%20recorded%20successfully');
}
