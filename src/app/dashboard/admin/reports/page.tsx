import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return redirect('/dashboard');
  }

  const [usersCount, activeSubsCount, drawsCount, winnersCount, donationsSum] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('draws').select('id', { count: 'exact', head: true }),
    supabase.from('winners').select('id', { count: 'exact', head: true }),
    supabase.from('donations').select('amount'),
  ]);

  const totalDonations = (donationsSum.data || []).reduce((sum, row) => sum + Number((row as { amount: number }).amount || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Reports & Analytics</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Live platform metrics for admin operations.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        <div className="glass" style={{ background: 'white', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Users</div>
          <div style={{ fontSize: '30px', fontWeight: 800 }}>{usersCount.count || 0}</div>
        </div>
        <div className="glass" style={{ background: 'white', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Active Subscribers</div>
          <div style={{ fontSize: '30px', fontWeight: 800 }}>{activeSubsCount.count || 0}</div>
        </div>
        <div className="glass" style={{ background: 'white', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Draws</div>
          <div style={{ fontSize: '30px', fontWeight: 800 }}>{drawsCount.count || 0}</div>
        </div>
        <div className="glass" style={{ background: 'white', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Winner Records</div>
          <div style={{ fontSize: '30px', fontWeight: 800 }}>{winnersCount.count || 0}</div>
        </div>
        <div className="glass" style={{ background: 'white', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Independent Donations (INR)</div>
          <div style={{ fontSize: '30px', fontWeight: 800 }}>{totalDonations.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  );
}
