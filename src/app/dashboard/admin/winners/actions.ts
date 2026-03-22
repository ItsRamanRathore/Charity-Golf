'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendSystemEmail } from '@/lib/notifications/email';
import { redirect } from 'next/navigation';

type LooseAdminClient = {
  from: (table: string) => {
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Admin%20access%20required');
  }

  return user;
}

export async function reviewWinner(formData: FormData) {
  const admin = await assertAdmin();
  const supabase = await createClient();
  const adminDb = getSupabaseAdminClient() as unknown as LooseAdminClient;

  const winnerId = String(formData.get('winnerId') || '');
  const decision = String(formData.get('decision') || '');
  const note = String(formData.get('note') || '').trim();

  const nextStatus = decision === 'approve' ? 'verified' : decision === 'reject' ? 'rejected' : null;
  if (!winnerId || !nextStatus) {
    redirect('/dashboard/admin/winners?error=Invalid%20review%20payload');
  }

  const { error } = await adminDb
    .from('winners')
    .update({
      status: nextStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      review_note: note || null,
    })
    .eq('id', winnerId);

  if (error) {
    redirect(`/dashboard/admin/winners?error=${encodeURIComponent(error.message)}`);
  }

  const { data: winnerRow } = await supabase
    .from('winners')
    .select('user_id, prize_amount, status')
    .eq('id', winnerId)
    .maybeSingle();

  if (winnerRow?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', winnerRow.user_id)
      .maybeSingle();

    if (profile?.email) {
      await sendSystemEmail({
        to: profile.email,
        subject: nextStatus === 'verified' ? 'Winner Verification Approved' : 'Winner Verification Rejected',
        html: `<p>Your winner verification status is now <strong>${nextStatus}</strong>.</p><p>Prize amount: INR ${Number(winnerRow.prize_amount || 0).toLocaleString('en-IN')}</p><p>Note: ${note || 'No note provided.'}</p>`,
      });
    }
  }

  redirect('/dashboard/admin/winners?success=Winner%20review%20updated');
}

export async function markWinnerPaid(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const adminDb = getSupabaseAdminClient() as unknown as LooseAdminClient;

  const winnerId = String(formData.get('winnerId') || '');
  if (!winnerId) {
    redirect('/dashboard/admin/winners?error=Missing%20winner%20id');
  }

  const { error } = await adminDb
    .from('winners')
    .update({ status: 'paid' })
    .eq('id', winnerId);

  if (error) {
    redirect(`/dashboard/admin/winners?error=${encodeURIComponent(error.message)}`);
  }

  const { data: winnerRow } = await supabase
    .from('winners')
    .select('user_id, prize_amount')
    .eq('id', winnerId)
    .maybeSingle();

  if (winnerRow?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', winnerRow.user_id)
      .maybeSingle();

    if (profile?.email) {
      await sendSystemEmail({
        to: profile.email,
        subject: 'Payout Completed',
        html: `<p>Your payout has been marked as <strong>paid</strong>.</p><p>Amount: INR ${Number(winnerRow.prize_amount || 0).toLocaleString('en-IN')}</p>`,
      });
    }
  }

  redirect('/dashboard/admin/winners?success=Payout%20status%20updated');
}
