import { createClient } from '@/lib/supabase/server';
import { withTimeout } from '@/lib/performance/query-timeout';
import { redirect } from 'next/navigation';
import { assignWinner, createDraw, publishDraw, simulateDraw } from './actions';

type DrawRow = {
  id: string;
  draw_date: string;
  type: string;
  status: string;
  prize_pool: number;
  numbers: number[];
  simulated_at?: string | null;
  simulation_summary?: { generatedAt?: string; tierShares?: { tier5?: number; tier4?: number; tier3?: number } } | null;
  jackpot_rollover_amount?: number | null;
};

type UserRow = {
  id: string;
  email: string | null;
};

export default async function AdminDrawsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return redirect('/dashboard');
  }

  let drawRows: DrawRow[] = [];
  let userRows: UserRow[] = [];

  try {
    const [drawsResult, usersResult] = await Promise.all([
      withTimeout(
        supabase
          .from('draws')
          .select('id, draw_date, type, status, prize_pool, numbers, simulated_at, simulation_summary, jackpot_rollover_amount')
          .order('draw_date', { ascending: false })
          .limit(20),
        1800,
        'Admin draws query timeout'
      ),
      withTimeout(
        supabase
          .from('profiles')
          .select('id, email')
          .order('created_at', { ascending: false })
          .limit(100),
        1800,
        'Admin users query timeout'
      ),
    ]);

    const typedDrawsResult = drawsResult as unknown as { data: DrawRow[] | null };
    const typedUsersResult = usersResult as unknown as { data: UserRow[] | null };

    if (typedDrawsResult.data) {
      drawRows = typedDrawsResult.data as DrawRow[];
    }

    if (typedUsersResult.data) {
      userRows = typedUsersResult.data as UserRow[];
    }
  } catch (fetchError) {
    console.error('Error fetching admin draw data:', fetchError);
    drawRows = [];
    userRows = [];
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Admin Draw Management</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px' }}>
        Create draws, publish results, and assign winner records with policy-backed admin controls.
      </p>

      {params.success && (
        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {decodeURIComponent(params.success)}
        </div>
      )}

      {params.error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        <div className="glass" style={{ background: 'white', padding: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px' }}>Create New Draw</h2>
          <form action={createDraw} style={{ display: 'grid', gap: '10px' }}>
            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Draw Date & Time
              <input type="datetime-local" name="drawDate" required style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
            </label>

            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Type
              <select name="drawType" defaultValue="random" style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <option value="random">Random</option>
                <option value="algorithmic">Algorithmic</option>
              </select>
            </label>

            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Prize Pool (USD)
              <input type="number" step="0.01" min="0" name="prizePool" required style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
            </label>

            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Winning Numbers (comma-separated)
              <input type="text" name="numbers" placeholder="4, 11, 18, 22, 39" style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                Leave blank for random draws to auto-generate 5 numbers.
              </div>
            </label>

            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>Create Draw</button>
          </form>
        </div>

        <div className="glass" style={{ background: 'white', padding: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px' }}>Assign Winner</h2>
          <form action={assignWinner} style={{ display: 'grid', gap: '10px' }}>
            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Draw
              <select name="drawId" required style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <option value="">Select draw</option>
                {drawRows.map((draw) => (
                  <option key={draw.id} value={draw.id}>
                    {new Date(draw.draw_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} - {draw.status}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              User
              <select name="userId" required style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <option value="">Select user</option>
                {userRows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.email || row.id}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Match Tier (3, 4, 5)
              <select name="matchTier" required defaultValue="3" style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Prize Amount (USD)
              <input type="number" step="0.01" min="0" name="prizeAmount" required style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
            </label>

            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>Assign Winner</button>
          </form>
        </div>
      </div>

      <div className="glass" style={{ background: 'white', padding: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px' }}>Recent Draws</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {drawRows.map((draw) => (
            <div key={draw.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {new Date(draw.draw_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Type: {draw.type} | Status: {draw.status} | Pool: ${draw.prize_pool}
                </div>
                {draw.simulated_at && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Simulated: {new Date(draw.simulated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                )}
                {draw.simulation_summary?.tierShares && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Sim Pool Split: 5-match ${draw.simulation_summary.tierShares.tier5 || 0} | 4-match ${draw.simulation_summary.tierShares.tier4 || 0} | 3-match ${draw.simulation_summary.tierShares.tier3 || 0}
                  </div>
                )}
                {!!draw.jackpot_rollover_amount && draw.jackpot_rollover_amount > 0 && (
                  <div style={{ fontSize: '12px', color: '#B45309' }}>
                    Jackpot rollover applied: ${draw.jackpot_rollover_amount}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Numbers: {(draw.numbers || []).join(', ') || 'Not set'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <form action={simulateDraw}>
                  <input type="hidden" name="drawId" value={draw.id} />
                  <button className="btn-secondary" type="submit">Simulate</button>
                </form>
                {draw.status !== 'published' && (
                  <form action={publishDraw}>
                    <input type="hidden" name="drawId" value={draw.id} />
                    <button className="btn-primary" type="submit">Publish</button>
                  </form>
                )}
              </div>
            </div>
          ))}

          {drawRows.length === 0 && <p style={{ color: 'var(--muted)' }}>No draws available.</p>}
        </div>
      </div>
    </div>
  );
}
