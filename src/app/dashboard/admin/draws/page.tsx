import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { assignWinner, createDraw, publishDraw } from './actions';

type DrawRow = {
  id: string;
  draw_date: string;
  type: string;
  status: string;
  prize_pool: number;
  numbers: number[];
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
    const drawsFetchPromise = supabase
      .from('draws')
      .select('id, draw_date, type, status, prize_pool, numbers')
      .order('draw_date', { ascending: false })
      .limit(20);

    const drawsTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );

    const drawsResult = (await Promise.race([
      drawsFetchPromise,
      drawsTimeoutPromise as unknown as Promise<typeof drawsFetchPromise>,
    ])) as unknown as { data: DrawRow[] | null };

    if (drawsResult.data) {
      drawRows = drawsResult.data as DrawRow[];
    }

    const usersFetchPromise = supabase
      .from('profiles')
      .select('id, email')
      .order('created_at', { ascending: false })
      .limit(100);

    const usersTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );

    const usersResult = (await Promise.race([
      usersFetchPromise,
      usersTimeoutPromise as unknown as Promise<typeof usersFetchPromise>,
    ])) as unknown as { data: UserRow[] | null };

    if (usersResult.data) {
      userRows = usersResult.data as UserRow[];
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
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Numbers: {(draw.numbers || []).join(', ') || 'Not set'}
                </div>
              </div>

              {draw.status !== 'published' && (
                <form action={publishDraw}>
                  <input type="hidden" name="drawId" value={draw.id} />
                  <button className="btn-secondary" type="submit">Publish</button>
                </form>
              )}
            </div>
          ))}

          {drawRows.length === 0 && <p style={{ color: 'var(--muted)' }}>No draws available.</p>}
        </div>
      </div>
    </div>
  );
}
