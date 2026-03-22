import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { submitScore } from './actions';

type Score = {
  id: string;
  score: number;
  score_date: string;
};

export default async function ScoresPage({
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

  let scores: Score[] = [];

  try {
    const fetchPromise = supabase
      .from('scores')
      .select('id, score, score_date')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );

    const result = (await Promise.race([
      fetchPromise,
      timeoutPromise as unknown as Promise<unknown>,
    ])) as unknown as { data: Score[] | null };

    scores = (result.data ?? []) as Score[];
  } catch (fetchError) {
    console.error('Error fetching scores:', fetchError);
    scores = [];
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Golf Scores</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Log your scores. Only the latest 5 scores are kept for draw logic.</p>

      {params.error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', maxWidth: '640px' }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      {params.success && (
        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', maxWidth: '640px' }}>
          {decodeURIComponent(params.success)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div className="glass" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Log New Score</h2>
          <form action={submitScore} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--muted)' }}>Stableford Score (1 - 45)</label>
              <input
                type="number"
                min="1"
                max="45"
                name="score"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'white',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--muted)' }}>Date</label>
              <input
                type="date"
                name="scoreDate"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'white',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Log Score
            </button>
          </form>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Score History (Latest 5)</h2>
          {scores.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No scores logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scores.map((scoreEntry) => (
                <div key={scoreEntry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '18px' }}>{scoreEntry.score} Points</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{scoreEntry.score_date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent)' }}>Stableford</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
