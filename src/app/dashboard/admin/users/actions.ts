'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
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
    redirect('/dashboard');
  }
}

export async function updateUserProfileAdmin(formData: FormData) {
  await assertAdmin();
  const admin = getSupabaseAdminClient() as unknown as LooseAdminClient;

  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || 'user');
  const subscriptionStatus = String(formData.get('subscriptionStatus') || 'inactive');

  if (!userId) {
    redirect('/dashboard/admin/users?error=Missing%20user%20id');
  }

  const { error } = await admin
    .from('profiles')
    .update({ role, subscription_status: subscriptionStatus })
    .eq('id', userId);

  if (error) {
    redirect(`/dashboard/admin/users?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/users?success=User%20updated');
}
