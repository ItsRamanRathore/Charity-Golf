import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createIndependentDonation, updateCharitySelection } from './actions';

type Charity = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  location: string | null;
  total_raised: number | null;
};

export default async function DashboardCharityPage({
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

  const [{ data: profile }, { data: charities }] = await Promise.all([
    supabase
      .from('profiles')
      .select('charity_id, charity_percentage')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('charities')
      .select('id, name, description, category, location, total_raised')
      .order('name', { ascending: true }),
  ]);

  const selectedCharity = (charities as Charity[] | null)?.find((charity) => charity.id === profile?.charity_id) ?? null;

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>My Charity</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px' }}>Manage the charity organization that your subscription supports.</p>

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

      <div className="glass" style={{ padding: '32px', maxWidth: '760px', background: 'white', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
          Active Selection: {selectedCharity?.name || 'Not selected yet'}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          {selectedCharity?.description || 'Choose a charity and set your recurring contribution percentage.'}
        </p>

        <form action={updateCharitySelection} style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Select Charity
            <select
              name="charityId"
              defaultValue={profile?.charity_id || ''}
              required
              style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <option value="" disabled>Select charity</option>
              {(charities as Charity[] | null)?.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name} {charity.category ? `(${charity.category})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Contribution Percentage (Min 10%)
            <input
              type="number"
              name="charityPercentage"
              defaultValue={profile?.charity_percentage || 10}
              min="10"
              max="100"
              required
              style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
            />
          </label>

          <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>
            Save Charity Settings
          </button>
        </form>

        <form action={createIndependentDonation} style={{ display: 'grid', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Independent Donation</h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Donate independently from gameplay to support any listed charity.
          </p>

          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Charity
            <select
              name="charityId"
              defaultValue={profile?.charity_id || ''}
              required
              style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <option value="" disabled>Select charity</option>
              {(charities as Charity[] | null)?.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Amount (INR)
            <input
              type="number"
              name="amount"
              step="0.01"
              min="1"
              required
              style={{ width: '100%', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
            />
          </label>

          <button className="btn-secondary" type="submit" style={{ justifyContent: 'center' }}>
            Record Donation
          </button>
        </form>
      </div>
    </div>
  );
}
