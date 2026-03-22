'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitScore(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const scoreInput = formData.get('score');
  const scoreDate = formData.get('scoreDate');

  const score = typeof scoreInput === 'string' ? Number.parseInt(scoreInput, 10) : Number.NaN;
  const dateValue = typeof scoreDate === 'string' ? scoreDate : '';

  if (!Number.isInteger(score) || score < 1 || score > 45 || !dateValue) {
    redirect('/dashboard/scores?error=Please%20enter%20a%20valid%20score%20between%201%20and%2045%20with%20a%20date.');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (dateValue > today) {
    redirect('/dashboard/scores?error=Score%20date%20cannot%20be%20in%20the%20future.');
  }

  const { error } = await supabase.from('scores').insert({
    user_id: user.id,
    score,
    score_date: dateValue,
  });

  if (error) {
    redirect(`/dashboard/scores?error=${encodeURIComponent(error.message)}`);
  }

  // Enforce rolling 5-score retention: newest five stay, oldest are removed.
  const { data: scoreRows } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (scoreRows && scoreRows.length > 5) {
    const idsToDelete = scoreRows.slice(5).map((row) => row.id);
    if (idsToDelete.length > 0) {
      await supabase.from('scores').delete().in('id', idsToDelete);
    }
  }

  redirect('/dashboard/scores?success=Score%20logged%20successfully.');
}

export async function editScore(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const scoreId = String(formData.get('scoreId') || '');
  const score = Number.parseInt(String(formData.get('score') || ''), 10);
  const scoreDate = String(formData.get('scoreDate') || '');

  if (!scoreId || !Number.isInteger(score) || score < 1 || score > 45 || !scoreDate) {
    redirect('/dashboard/scores?error=Invalid%20score%20edit%20payload.');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (scoreDate > today) {
    redirect('/dashboard/scores?error=Score%20date%20cannot%20be%20in%20the%20future.');
  }

  const { error } = await supabase
    .from('scores')
    .update({ score, score_date: scoreDate })
    .eq('id', scoreId)
    .eq('user_id', user.id);

  if (error) {
    redirect(`/dashboard/scores?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/scores?success=Score%20updated%20successfully.');
}
