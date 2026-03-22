import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateUserProfileAdmin } from './actions';

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  subscription_status: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/auth/login');
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (currentProfile?.role !== 'admin') {
    return redirect('/dashboard');
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, subscription_status')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (profiles || []) as ProfileRow[];

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>User Management</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '22px' }}>Manage user roles and subscription states.</p>

      {params.error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      {params.success && (
        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {decodeURIComponent(params.success)}
        </div>
      )}

      <div style={{ display: 'grid', gap: '10px' }}>
        {rows.map((row) => (
          <div key={row.id} className="glass" style={{ background: 'white', padding: '14px' }}>
            <div style={{ fontWeight: 700 }}>{row.full_name || 'User'} ({row.email || row.id})</div>
            <form action={updateUserProfileAdmin} style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="hidden" name="userId" value={row.id} />
              <select name="role" defaultValue={row.role} style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <select name="subscriptionStatus" defaultValue={row.subscription_status} style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <option value="inactive">inactive</option>
                <option value="active">active</option>
                <option value="past_due">past_due</option>
                <option value="canceled">canceled</option>
              </select>
              <button className="btn-secondary" type="submit">Save</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
