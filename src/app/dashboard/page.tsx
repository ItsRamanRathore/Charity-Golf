import { createClient } from '@/lib/supabase/server';
import { withTimeout } from '@/lib/performance/query-timeout';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/auth/login');
  }

  let profile = null;
  let winningsTotal = 0;
  let pendingPayoutAmount = 0;
  let drawsEntered = 0;

  try {
    const result = (await withTimeout(
      supabase
        .from('profiles')
        .select('*, charities(name)')
        .eq('id', user.id)
        .single(),
      3500,
      'Dashboard profile query timeout'
    )) as unknown as { data: { full_name?: string; role?: string; charity_percentage?: number; charities?: { name: string }; subscription_status?: string } | null };

    profile = result.data || null;
  } catch {
    profile = null;
  }

  try {
    const [winnersResult, drawsResult] = await Promise.all([
      withTimeout(
        supabase
          .from('winners')
          .select('prize_amount, status')
          .eq('user_id', user.id),
        1800,
        'Dashboard winners query timeout'
      ),
      withTimeout(
        supabase
          .from('draws')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
        1800,
        'Dashboard draws count query timeout'
      ),
    ]);

    const winnerRows = (winnersResult as unknown as { data: Array<{ prize_amount: number; status: string }> | null }).data || [];
    winningsTotal = winnerRows.reduce((sum, row) => sum + Number(row.prize_amount || 0), 0);
    pendingPayoutAmount = winnerRows
      .filter((row) => row.status !== 'paid')
      .reduce((sum, row) => sum + Number(row.prize_amount || 0), 0);
    drawsEntered = (drawsResult as unknown as { count?: number | null }).count || 0;
  } catch {
    winningsTotal = 0;
    pendingPayoutAmount = 0;
    drawsEntered = 0;
  }

  const fullName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const role = profile?.role || 'user';
  const charityName = profile?.charities?.name || 'None selected';
  const subscriptionStatus = profile?.subscription_status || 'inactive';

  const isActiveSubscriber = subscriptionStatus === 'active';
  const statusLabel = role === 'admin' ? 'Admin Portal' : `Subscriber: ${subscriptionStatus}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Welcome Back, {fullName}</h1>
          <p style={{ color: 'var(--muted)' }}>Here is your performance and impact overview.</p>
        </div>
        
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: isActiveSubscriber ? 'var(--accent)' : '#F59E0B', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>Total Winnings</div>
          <div style={{ fontSize: '36px', fontWeight: 800 }}>INR {winningsTotal.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Pending payout: INR {pendingPayoutAmount.toLocaleString('en-IN')}</div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>Active Pool</div>
          <div style={{ fontSize: '36px', fontWeight: 800 }}>{isActiveSubscriber ? '$14,580' : 'Locked'}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            {isActiveSubscriber ? `${drawsEntered} published draws tracked` : 'Activate subscription to enter draw pool'}
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>Supporting</div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{charityName}</div>
          <div style={{ fontSize: '14px', color: 'var(--accent)' }}>{profile?.charity_percentage || 10}% contribution</div>
        </div>
      </div>

      {/* Main Grid: Draws & Scores Placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Recent Draws</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid rgba(0,0,0,0.03)', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>May Major Draw</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>5-Number Match</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600 }}>$5,000 Potential</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Pending</div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Next Draw</h2>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--primary)', filter: 'drop-shadow(0 0 10px rgba(109,40,217,0.1))' }}>12:04:15</div>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>Days : Hours : Mins</p>
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <div className="glass" style={{ marginTop: '24px', padding: '24px', background: 'white' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Admin Quick Actions</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            You are signed in as admin. Use these controls for platform operations.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/dashboard/admin" className="btn-secondary">Admin Home</Link>
            <Link href="/dashboard/admin/draws" className="btn-primary">Manage Draws</Link>
          </div>
        </div>
      )}
    </div>
  );
}
