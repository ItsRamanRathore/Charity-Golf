import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#0A0410', color: '#F9FAFB', padding: '60px 5% 30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', maxWidth: '1200px', margin: '0 auto', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
            <span style={{ color: 'var(--primary)' }}>Digital</span>Heroes
          </div>
          <p style={{ color: '#9CA3AF', maxWidth: '280px', fontSize: '14px', lineHeight: 1.6 }}>
            The premium subscription platform for golfers aiming to fund global impact.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '60px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'white' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <Link href="/charities" className="footer-link">Charities</Link>
              <Link href="/draws" className="footer-link">Draws</Link>
              <Link href="/about" className="footer-link">About Us</Link>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'white' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms Of Service</Link>
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
        © {new Date().getFullYear()} Digital Heroes. All rights reserved. Available globally.
      </div>
    </footer>
  );
}
