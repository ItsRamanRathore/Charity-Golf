import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardDrawsPage() {
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
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_status !== 'active') {
    return redirect('/dashboard/subscription');
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Monthly Draws</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Track your active entries and upcoming pool prizes.</p>

      <div className="glass" style={{ padding: '32px', maxWidth: '600px', background: 'white' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Upcoming Draw: May Major</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          To qualify for this draw, ensure your latest 5 scores are verified accurately inside the scores tab.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Current Prize Pool</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>$14,580</div>
          </div>
          <button className="btn-primary">View Rules (IST)</button>
        </div>
      </div>
    </div>
  );
}
