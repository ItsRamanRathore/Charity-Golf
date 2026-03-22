import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminHomePage() {
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

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px' }}>
        Manage platform operations and draw workflows from one place.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <div className="glass" style={{ background: 'white', padding: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Draw Management</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            Create, publish, and assign winners for monthly draws.
          </p>
          <Link href="/dashboard/admin/draws" className="btn-primary" style={{ justifyContent: 'center' }}>
            Open Draw Admin
          </Link>
        </div>

        <div className="glass" style={{ background: 'white', padding: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Admin Access</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            This area is only visible to users with role set to admin.
          </p>
          <span style={{ display: 'inline-block', padding: '8px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', color: '#047857', fontSize: '12px', fontWeight: 700 }}>
            Role verified: admin
          </span>
        </div>

        <div className="glass" style={{ background: 'white', padding: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>User Management</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            Update user roles and subscription states.
          </p>
          <Link href="/dashboard/admin/users" className="btn-secondary" style={{ justifyContent: 'center' }}>
            Manage Users
          </Link>
        </div>

        <div className="glass" style={{ background: 'white', padding: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Charities</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            Create and maintain charity listings and spotlight content.
          </p>
          <Link href="/dashboard/admin/charities" className="btn-secondary" style={{ justifyContent: 'center' }}>
            Manage Charities
          </Link>
        </div>

        <div className="glass" style={{ background: 'white', padding: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Winners & Payouts</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            Verify proof submissions and mark payouts complete.
          </p>
          <Link href="/dashboard/admin/winners" className="btn-secondary" style={{ justifyContent: 'center' }}>
            Review Winners
          </Link>
        </div>

        <div className="glass" style={{ background: 'white', padding: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Reports</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
            Track users, subscriptions, draws, and contributions.
          </p>
          <Link href="/dashboard/admin/reports" className="btn-secondary" style={{ justifyContent: 'center' }}>
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
