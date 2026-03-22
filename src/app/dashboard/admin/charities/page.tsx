import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createCharityAdmin, deleteCharityAdmin, updateCharityAdmin } from './actions';

type CharityRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  location: string | null;
  website_url: string | null;
  is_featured: boolean;
};

export default async function AdminCharitiesPage({
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

  const { data: charities } = await supabase
    .from('charities')
    .select('id, name, description, category, location, website_url, is_featured')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (charities || []) as CharityRow[];

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Charity Management</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '22px' }}>Add, edit, and feature charities for public discovery.</p>

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

      <div className="glass" style={{ background: 'white', padding: '16px', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Add Charity</h2>
        <form action={createCharityAdmin} style={{ display: 'grid', gap: '8px', maxWidth: '560px' }}>
          <input name="name" placeholder="Charity name" required style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
          <textarea name="description" placeholder="Charity description" rows={3} style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
          <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>Create Charity</button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {rows.map((row) => (
          <div key={row.id} className="glass" style={{ background: 'white', padding: '14px' }}>
            <form action={updateCharityAdmin} style={{ display: 'grid', gap: '8px' }}>
              <input type="hidden" name="charityId" value={row.id} />
              <input name="name" defaultValue={row.name} required style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
              <textarea name="description" defaultValue={row.description || ''} rows={2} style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                <input name="category" defaultValue={row.category || ''} placeholder="Category" style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                <input name="location" defaultValue={row.location || ''} placeholder="Location" style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                <input name="websiteUrl" defaultValue={row.website_url || ''} placeholder="Website URL" style={{ padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                <input type="checkbox" name="isFeatured" defaultChecked={row.is_featured} />
                Featured / spotlight
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-secondary" type="submit">Save</button>
              </div>
            </form>
            <form action={deleteCharityAdmin} style={{ marginTop: '8px' }}>
              <input type="hidden" name="charityId" value={row.id} />
              <button className="btn-secondary" type="submit">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
