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

  const [{ data: publishedDraws }, { data: scoreRows }, { data: winnerRows }] = await Promise.all([
    supabase
      .from('draws')
      .select('id, draw_date, type, status, prize_pool, jackpot_rollover_amount')
      .eq('status', 'published')
      .order('draw_date', { ascending: false })
      .limit(12),
    supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })
      .limit(5),
    supabase
      .from('winners')
      .select('id, prize_amount, status')
      .eq('user_id', user.id),
  ]);

  const scoresCount = (scoreRows || []).length;
  const winningsTotal = (winnerRows || []).reduce((sum, row) => sum + Number(row.prize_amount || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Monthly Draws</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Track your active entries and upcoming pool prizes.</p>

      <div className="glass" style={{ padding: '20px', maxWidth: '880px', background: 'white', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Eligible Scores</div>
            <div style={{ fontWeight: 800, fontSize: '24px' }}>{scoresCount}/5</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Draws Entered</div>
            <div style={{ fontWeight: 800, fontSize: '24px' }}>{publishedDraws?.length || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Won</div>
            <div style={{ fontWeight: 800, fontSize: '24px' }}>INR {winningsTotal.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px', maxWidth: '880px' }}>
        {(publishedDraws || []).map((draw) => (
          <div key={draw.id} className="glass" style={{ background: 'white', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {new Date(draw.draw_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Type: {draw.type} • Status: {draw.status}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Prize Pool</div>
                <div style={{ fontWeight: 800, color: 'var(--accent)' }}>INR {Number(draw.prize_pool || 0).toLocaleString('en-IN')}</div>
                {!!draw.jackpot_rollover_amount && draw.jackpot_rollover_amount > 0 && (
                  <div style={{ fontSize: '12px', color: '#B45309' }}>
                    Rollover: INR {Number(draw.jackpot_rollover_amount).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(publishedDraws || []).length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No published draws yet.</p>
        )}
      </div>

      <div className="glass" style={{ padding: '20px', background: 'white', marginTop: '16px', maxWidth: '880px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Draw Rules</h2>
        <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
          <div>1. 5-match tier receives 40% of pool and rolls over when unclaimed.</div>
          <div>2. 4-match tier receives 35% of pool.</div>
          <div>3. 3-match tier receives 25% of pool.</div>
          <div>4. Latest 5 scores are required for active qualification.</div>
        </div>
      </div>
    </div>
  );
}
