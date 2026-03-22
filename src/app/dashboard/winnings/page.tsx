import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { uploadWinnerProof } from './actions';

type WinnerRow = {
  id: string;
  draw_id: string;
  match_tier: number;
  prize_amount: number;
  status: 'pending' | 'verified' | 'paid' | 'rejected';
  proof_url: string | null;
  created_at: string;
};

export default async function WinningsPage({
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

  const { data: winners } = await supabase
    .from('winners')
    .select('id, draw_id, match_tier, prize_amount, status, proof_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const winnerRows = (winners || []) as WinnerRow[];

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Winnings & Verification</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
        Track winnings and upload proof screenshots for verification.
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
        {winnerRows.map((winner) => (
          <div key={winner.id} className="glass" style={{ background: 'white', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Draw #{winner.draw_id.slice(0, 8)}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Tier: {winner.match_tier}-match</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent)' }}>INR {Number(winner.prize_amount || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'capitalize' }}>Status: {winner.status}</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--muted)' }}>
              Proof URL: {winner.proof_url ? winner.proof_url : 'Not uploaded yet'}
            </div>

            {(winner.status === 'pending' || winner.status === 'rejected') && (
              <form action={uploadWinnerProof} style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="hidden" name="winnerId" value={winner.id} />
                <input
                  type="url"
                  name="proofUrl"
                  required
                  placeholder="https://...proof-screenshot"
                  defaultValue={winner.proof_url || ''}
                  style={{ minWidth: '280px', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                />
                <button className="btn-secondary" type="submit">Submit Proof</button>
              </form>
            )}
          </div>
        ))}

        {winnerRows.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No winnings yet.</p>
        )}
      </div>
    </div>
  );
}
