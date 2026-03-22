import { signup } from '../actions';
import Link from 'next/link';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFC' }}>
      <div className="glass" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Create Account</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '32px' }}>Start supporting charities & tracking scores</p>

        {params && params.error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action={signup} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--muted)' }}>Full Name</label>
            <input 
              type="text" 
              name="fullName" 
              required 
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--muted)' }}>Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--muted)' }}>Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'white'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            Get Started
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--muted)' }}>
          Already have an account? <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </main>
  );
}
