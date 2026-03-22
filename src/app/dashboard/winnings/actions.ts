'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function uploadWinnerProof(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const winnerId = String(formData.get('winnerId') || '');
  const proofUrl = String(formData.get('proofUrl') || '').trim();

  if (!winnerId || !proofUrl) {
    redirect('/dashboard/winnings?error=Invalid%20proof%20upload%20payload');
  }

  const { error } = await supabase
    .from('winners')
    .update({ proof_url: proofUrl, status: 'pending' })
    .eq('id', winnerId)
    .eq('user_id', user.id);

  if (error) {
    redirect(`/dashboard/winnings?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/winnings?success=Proof%20submitted%20for%20review');
}
