'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logServerError, logServerWarn } from '@/lib/observability/logger';
import { redirect } from 'next/navigation';

type AdminMutationResult = { error: { message: string } | null };

type AdminTableMutationClient = {
  insert: (values: Record<string, unknown>) => Promise<AdminMutationResult>;
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<AdminMutationResult>;
  };
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
    };
  };
};

type AdminDbClient = {
  from: (table: string) => AdminTableMutationClient;
};

function getPoolShares(prizePool: number) {
  return {
    tier5: Number((prizePool * 0.4).toFixed(2)),
    tier4: Number((prizePool * 0.35).toFixed(2)),
    tier3: Number((prizePool * 0.25).toFixed(2)),
  };
}

async function assertAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logServerWarn('admin.draws.auth.required', {
      hasAuthError: Boolean(authError),
    });
    redirect('/auth/login');
  }

  const byId = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const profile = byId.data ?? (user.email
    ? (await supabase
        .from('profiles')
        .select('role')
        .eq('email', user.email)
        .maybeSingle()).data
    : null);

  if (profile?.role !== 'admin') {
    logServerWarn('admin.draws.auth.forbidden', {
      userId: user.id,
      role: profile?.role ?? 'unknown',
    });
    redirect('/dashboard?error=Admin%20access%20required');
  }

  return { supabase, userId: user.id };
}

function parseNumbers(raw: string) {
  return raw
    .split(',')
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((n) => Number.isInteger(n));
}

function generateRandomNumbers(count = 5, min = 1, max = 50) {
  const set = new Set<number>();
  while (set.size < count) {
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    set.add(value);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function generateAlgorithmicNumbersFromScores(rawScores: number[], count = 5) {
  const freq = new Map<number, number>();
  for (const score of rawScores) {
    if (!Number.isInteger(score)) {
      continue;
    }
    freq.set(score, (freq.get(score) || 0) + 1);
  }

  const ranked = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([score]) => score)
    .slice(0, count);

  if (ranked.length < count) {
    const fallback = generateRandomNumbers(count);
    for (const number of fallback) {
      if (ranked.length >= count) {
        break;
      }
      if (!ranked.includes(number)) {
        ranked.push(number);
      }
    }
  }

  return ranked.sort((a, b) => a - b);
}

export async function createDraw(formData: FormData) {
  const requestId = crypto.randomUUID();
  const { userId, supabase } = await assertAdmin();
  const supabaseAdmin = getSupabaseAdminClient() as unknown as AdminDbClient;

  const drawDateRaw = String(formData.get('drawDate') || '');
  const drawTypeRaw = String(formData.get('drawType') || 'random');
  const prizePoolRaw = String(formData.get('prizePool') || '0');
  const numbersRaw = String(formData.get('numbers') || '');

  const drawType = drawTypeRaw === 'algorithmic' ? 'algorithmic' : 'random';
  const prizePool = Number.parseFloat(prizePoolRaw);
  const parsedNumbers = parseNumbers(numbersRaw);

  let numbers = parsedNumbers.length > 0
    ? Array.from(new Set(parsedNumbers))
    : drawType === 'random'
      ? generateRandomNumbers(5)
      : [];

  if (drawType === 'algorithmic' && numbers.length === 0) {
    const { data: historicalScores } = await supabase
      .from('scores')
      .select('score')
      .order('created_at', { ascending: false })
      .limit(1000);

    numbers = generateAlgorithmicNumbersFromScores(
      (historicalScores || []).map((row) => Number((row as { score: number }).score))
    );
  }
  const drawDate = new Date(drawDateRaw);
  const now = new Date();

  let validationError = '';

  if (!drawDateRaw || Number.isNaN(drawDate.getTime())) {
    validationError = 'Invalid or missing draw date/time';
  } else if (drawDate < now) {
    validationError = 'Draw date/time cannot be in the past';
  } else if (Number.isNaN(prizePool) || prizePool < 0) {
    validationError = 'Prize pool must be a valid non-negative number';
  } else if (numbers.length < 5) {
    validationError = 'Please provide at least 5 valid numbers';
  }

  if (validationError) {
    logServerWarn('admin.draws.create.invalid_payload', {
      requestId,
      userId,
      drawDateRaw,
      drawType,
      prizePoolRaw,
      numbersCount: numbers.length,
      validationError,
    });
    redirect(
      `/dashboard/admin/draws?error=${encodeURIComponent(
        `Invalid draw payload: ${validationError}`
      )}`
    );
  }

  const { error } = await supabaseAdmin
    .from('draws')
    .insert({
      draw_date: drawDate.toISOString(),
      type: drawType,
      status: 'pending',
      numbers,
      prize_pool: prizePool,
    });

  if (error) {
    logServerError('admin.draws.create.failed', error, {
      requestId,
      userId,
      drawDateRaw,
      drawType,
    });
    redirect(
      `/dashboard/admin/draws?error=${encodeURIComponent(
        `Unable to create draw. Ref: ${requestId}`
      )}`
    );
  }

  redirect('/dashboard/admin/draws?success=Draw%20created');
}

export async function publishDraw(formData: FormData) {
  const requestId = crypto.randomUUID();
  const { userId, supabase } = await assertAdmin();
  const supabaseAdmin = getSupabaseAdminClient() as unknown as AdminDbClient;

  const drawId = String(formData.get('drawId') || '');
  if (!drawId) {
    logServerWarn('admin.draws.publish.missing_draw_id', {
      requestId,
      userId,
    });
    redirect('/dashboard/admin/draws?error=Missing%20draw%20id');
  }

  const drawFetch = await supabase
    .from('draws')
    .select('id, prize_pool')
    .eq('id', drawId)
    .maybeSingle();

  const currentDrawPrizePool = Number(drawFetch.data?.prize_pool || 0);

  const tier5Winners = await supabase
    .from('winners')
    .select('id')
    .eq('draw_id', drawId)
    .eq('match_tier', 5);

  let rolloverAmount = 0;
  if ((tier5Winners.data || []).length === 0 && currentDrawPrizePool > 0) {
    rolloverAmount = Number((currentDrawPrizePool * 0.4).toFixed(2));
  }

  const { error } = await supabaseAdmin
    .from('draws')
    .update({ status: 'published', jackpot_rollover_amount: rolloverAmount })
    .eq('id', drawId);

  if (error) {
    logServerError('admin.draws.publish.failed', error, {
      requestId,
      userId,
      drawId,
    });
    redirect(
      `/dashboard/admin/draws?error=${encodeURIComponent(
        `Unable to publish draw. Ref: ${requestId}`
      )}`
    );
  }

  if (rolloverAmount > 0) {
    const { data: nextPending } = await supabase
      .from('draws')
      .select('id, prize_pool')
      .eq('status', 'pending')
      .order('draw_date', { ascending: true })
      .maybeSingle();

    if (nextPending?.id) {
      const nextPool = Number(nextPending.prize_pool || 0) + rolloverAmount;
      await supabaseAdmin
        .from('draws')
        .update({ prize_pool: nextPool })
        .eq('id', String(nextPending.id));
    }
  }

  redirect('/dashboard/admin/draws?success=Draw%20published');
}

export async function simulateDraw(formData: FormData) {
  const requestId = crypto.randomUUID();
  const { userId } = await assertAdmin();
  const supabaseAdmin = getSupabaseAdminClient() as unknown as AdminDbClient;

  const drawId = String(formData.get('drawId') || '');
  if (!drawId) {
    redirect('/dashboard/admin/draws?error=Missing%20draw%20id%20for%20simulation');
  }

  const drawRead = await supabaseAdmin
    .from('draws')
    .select('id, prize_pool')
    .eq('id', drawId)
    .maybeSingle();

  const draw = drawRead.data;
  if (!draw) {
    redirect('/dashboard/admin/draws?error=Draw%20not%20found');
  }

  const prizePool = Number(draw?.prize_pool || 0);
  const shares = getPoolShares(prizePool);

  const simulationSummary = {
    generatedAt: new Date().toISOString(),
    requestId,
    adminUserId: userId,
    logic: 'pre-publish simulation',
    totalPrizePool: prizePool,
    tierShares: shares,
    notes: 'Rollover applies to 5-match share when no top-tier winner exists at publish time.',
  };

  const { error } = await supabaseAdmin
    .from('draws')
    .update({
      simulation_summary: simulationSummary,
      simulated_at: new Date().toISOString(),
    })
    .eq('id', drawId);

  if (error) {
    logServerError('admin.draws.simulation.failed', error, {
      requestId,
      userId,
      drawId,
    });
    redirect(
      `/dashboard/admin/draws?error=${encodeURIComponent(
        `Unable to run simulation. Ref: ${requestId}`
      )}`
    );
  }

  redirect('/dashboard/admin/draws?success=Simulation%20saved');
}

export async function assignWinner(formData: FormData) {
  const requestId = crypto.randomUUID();
  const { userId: adminUserId } = await assertAdmin();
  const supabaseAdmin = getSupabaseAdminClient() as unknown as AdminDbClient;

  const drawId = String(formData.get('drawId') || '');
  const userId = String(formData.get('userId') || '');
  const matchTier = Number.parseInt(String(formData.get('matchTier') || ''), 10);
  const prizeAmount = Number.parseFloat(String(formData.get('prizeAmount') || '0'));

  if (!drawId || !userId || ![3, 4, 5].includes(matchTier) || Number.isNaN(prizeAmount) || prizeAmount < 0) {
    logServerWarn('admin.draws.assign.invalid_payload', {
      requestId,
      adminUserId,
      drawId,
      selectedUserId: userId,
      matchTier,
    });
    redirect('/dashboard/admin/draws?error=Invalid%20winner%20payload');
  }

  const { error } = await supabaseAdmin.from('winners').insert({
    draw_id: drawId,
    user_id: userId,
    match_tier: matchTier,
    prize_amount: prizeAmount,
    status: 'pending',
  });

  if (error) {
    logServerError('admin.draws.assign.failed', error, {
      requestId,
      adminUserId,
      drawId,
      selectedUserId: userId,
      matchTier,
    });
    redirect(
      `/dashboard/admin/draws?error=${encodeURIComponent(
        `Unable to assign winner. Ref: ${requestId}`
      )}`
    );
  }

  redirect('/dashboard/admin/draws?success=Winner%20record%20created');
}
