import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 5%',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
    }}>
      <Link href="/" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--foreground)' }}>
        <span style={{ color: 'var(--primary)' }}>Digital</span>Heroes
      </Link>
      
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center', color: 'var(--foreground)' }}>
        <Link href="/" className="nav-link nav-link-active">Home</Link>
        <Link href="/charities" className="nav-link">Charities</Link>
        <Link href="/draws" className="nav-link">Draws</Link>
        <Link href="/about" className="nav-link">About</Link>
        
        <Link href="/auth/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Login
        </Link>
        <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
