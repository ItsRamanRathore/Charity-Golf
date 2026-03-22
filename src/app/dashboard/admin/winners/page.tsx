import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { markWinnerPaid, reviewWinner } from './actions';

type WinnerAdminRow = {
  id: string;
  draw_id: string;
  user_id: string;
  match_tier: number;
  prize_amount: number;
  status: 'pending' | 'verified' | 'paid' | 'rejected';
  proof_url: string | null;
  review_note: string | null;
  reviewed_at: string | null;
};

export default async function AdminWinnersPage({
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return redirect('/dashboard');
  }

  const { data: winners } = await supabase
    .from('winners')
    .select('id, draw_id, user_id, match_tier, prize_amount, status, proof_url, review_note, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (winners || []) as WinnerAdminRow[];

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Winner Verification & Payouts</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '22px' }}>
        Approve or reject proof submissions and mark verified winners as paid.
      </p>

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

      <div style={{ display: 'grid', gap: '12px' }}>
        {rows.map((winner) => (
          <div key={winner.id} className="glass" style={{ background: 'white', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Winner #{winner.id.slice(0, 8)}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Draw: {winner.draw_id.slice(0, 8)} • User: {winner.user_id.slice(0, 8)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800 }}>INR {Number(winner.prize_amount || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '12px', textTransform: 'capitalize', color: 'var(--muted)' }}>Status: {winner.status}</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--muted)' }}>
              Proof URL: {winner.proof_url || 'No proof submitted yet'}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <form action={reviewWinner} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="hidden" name="winnerId" value={winner.id} />
                <input type="hidden" name="decision" value="approve" />
                <input name="note" placeholder="Review note" style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                <button className="btn-secondary" type="submit">Approve</button>
              </form>

              <form action={reviewWinner} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="hidden" name="winnerId" value={winner.id} />
                <input type="hidden" name="decision" value="reject" />
                <input name="note" placeholder="Rejection note" style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                <button className="btn-secondary" type="submit">Reject</button>
              </form>

              {winner.status === 'verified' && (
                <form action={markWinnerPaid}>
                  <input type="hidden" name="winnerId" value={winner.id} />
                  <button className="btn-primary" type="submit">Mark Paid</button>
                </form>
              )}
            </div>

            {winner.review_note && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                Review note: {winner.review_note}
              </div>
            )}
          </div>
        ))}

        {rows.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No winner records yet.</p>
        )}
      </div>
    </div>
  );
}
