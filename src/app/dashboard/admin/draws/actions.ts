'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function assertAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Admin%20access%20required');
  }

  return supabase;
}

function parseNumbers(raw: string) {
  return raw
    .split(',')
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((n) => Number.isInteger(n));
}

export async function createDraw(formData: FormData) {
  const supabase = await assertAdmin();

  const drawDateRaw = String(formData.get('drawDate') || '');
  const drawTypeRaw = String(formData.get('drawType') || 'random');
  const prizePoolRaw = String(formData.get('prizePool') || '0');
  const numbersRaw = String(formData.get('numbers') || '');

  const drawType = drawTypeRaw === 'algorithmic' ? 'algorithmic' : 'random';
  const prizePool = Number.parseFloat(prizePoolRaw);
  const numbers = parseNumbers(numbersRaw);

  if (!drawDateRaw || Number.isNaN(prizePool) || prizePool < 0) {
    redirect('/dashboard/admin/draws?error=Invalid%20draw%20payload');
  }

  const { error } = await supabase.from('draws').insert({
    draw_date: drawDateRaw,
    type: drawType,
    status: 'pending',
    numbers,
    prize_pool: prizePool,
  });

  if (error) {
    redirect(`/dashboard/admin/draws?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/draws?success=Draw%20created');
}

export async function publishDraw(formData: FormData) {
  const supabase = await assertAdmin();

  const drawId = String(formData.get('drawId') || '');
  if (!drawId) {
    redirect('/dashboard/admin/draws?error=Missing%20draw%20id');
  }

  const { error } = await supabase
    .from('draws')
    .update({ status: 'published' })
    .eq('id', drawId);

  if (error) {
    redirect(`/dashboard/admin/draws?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/draws?success=Draw%20published');
}

export async function assignWinner(formData: FormData) {
  const supabase = await assertAdmin();

  const drawId = String(formData.get('drawId') || '');
  const userId = String(formData.get('userId') || '');
  const matchTier = Number.parseInt(String(formData.get('matchTier') || ''), 10);
  const prizeAmount = Number.parseFloat(String(formData.get('prizeAmount') || '0'));

  if (!drawId || !userId || ![3, 4, 5].includes(matchTier) || Number.isNaN(prizeAmount) || prizeAmount < 0) {
    redirect('/dashboard/admin/draws?error=Invalid%20winner%20payload');
  }

  const { error } = await supabase.from('winners').insert({
    draw_id: drawId,
    user_id: userId,
    match_tier: matchTier,
    prize_amount: prizeAmount,
    status: 'pending',
  });

  if (error) {
    redirect(`/dashboard/admin/draws?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/draws?success=Winner%20record%20created');
}
