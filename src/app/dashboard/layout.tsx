import Link from 'next/link';
import { logout } from '../auth/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const isAdmin = profile?.role === 'admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAFC', color: 'var(--foreground)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#FFFFFF',
        borderRight: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--primary)' }}>Digital</span>Heroes
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <Link href="/dashboard" style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(109, 40, 217, 0.08)', color: 'var(--primary)', fontWeight: 600 }}>
            Overview
          </Link>
          <Link href="/dashboard/scores" style={{ padding: '12px 16px', borderRadius: '10px', color: 'var(--muted)', transition: '0.2s' }}>
            Golf Scores
          </Link>
          <Link href="/dashboard/draws" style={{ padding: '12px 16px', borderRadius: '10px', color: 'var(--muted)' }}>
            Draws
          </Link>
          <Link href="/dashboard/charity" style={{ padding: '12px 16px', borderRadius: '10px', color: 'var(--muted)' }}>
            My Charity
          </Link>
          <Link href="/dashboard/subscription" style={{ padding: '12px 16px', borderRadius: '10px', color: 'var(--muted)' }}>
            Subscription
          </Link>
          {isAdmin && (
            <Link href="/dashboard/admin/draws" style={{ padding: '12px 16px', borderRadius: '10px', color: 'var(--muted)' }}>
              Admin Draws
            </Link>
          )}
        </nav>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{isAdmin ? 'Admin User' : 'Standard User'}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Active Pool</div>
          
          <form action={logout}>
            <button type="submit" style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '40px 5%', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
