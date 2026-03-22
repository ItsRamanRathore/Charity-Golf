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

  redirect('/dashboard/scores?success=Score%20logged%20successfully.');
}
