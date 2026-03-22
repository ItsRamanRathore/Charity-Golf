'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

type LooseAdminClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
    delete: () => {
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

export async function createCharityAdmin(formData: FormData) {
  await assertAdmin();
  const admin = getSupabaseAdminClient() as unknown as LooseAdminClient;

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!name) {
    redirect('/dashboard/admin/charities?error=Charity%20name%20is%20required');
  }

  const { error } = await admin.from('charities').insert({
    name,
    description: description || null,
    is_featured: false,
  });

  if (error) {
    redirect(`/dashboard/admin/charities?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/charities?success=Charity%20created');
}

export async function updateCharityAdmin(formData: FormData) {
  await assertAdmin();
  const admin = getSupabaseAdminClient() as unknown as LooseAdminClient;

  const charityId = String(formData.get('charityId') || '');
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const websiteUrl = String(formData.get('websiteUrl') || '').trim();
  const isFeatured = String(formData.get('isFeatured') || '') === 'on';

  if (!charityId || !name) {
    redirect('/dashboard/admin/charities?error=Invalid%20charity%20payload');
  }

  const { error } = await admin
    .from('charities')
    .update({
      name,
      description: description || null,
      category: category || null,
      location: location || null,
      website_url: websiteUrl || null,
      is_featured: isFeatured,
    })
    .eq('id', charityId);

  if (error) {
    redirect(`/dashboard/admin/charities?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/charities?success=Charity%20updated');
}

export async function deleteCharityAdmin(formData: FormData) {
  await assertAdmin();
  const admin = getSupabaseAdminClient() as unknown as LooseAdminClient;

  const charityId = String(formData.get('charityId') || '');
  if (!charityId) {
    redirect('/dashboard/admin/charities?error=Missing%20charity%20id');
  }

  const { error } = await admin.from('charities').delete().eq('id', charityId);
  if (error) {
    redirect(`/dashboard/admin/charities?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard/admin/charities?success=Charity%20deleted');
}
