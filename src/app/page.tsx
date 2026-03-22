import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFC' }}>
      <Navbar />
      <Hero />
      
      {/* Bento Grid Features Section */}
      <section style={{ padding: '80px 5%', background: '#FFFFFF', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', background: 'rgba(109, 40, 217, 0.08)', padding: '6px 14px', borderRadius: '20px' }}>
            Why Choose Us
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 800, marginTop: '16px', letterSpacing: '-1.5px' }}>
            Designed for Impact, Built for Performance
          </h2>
        </div>

        {/* Bento Grid Structure */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Big Card 1: 7 Columns */}
          <div className="glass" style={{
            gridColumn: 'span 7',
            padding: '40px',
            background: 'linear-gradient(145deg, #ffffff 0%, #F9FAFB 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏆</div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Verified Accuracy</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, maxWidth: '440px' }}>
              We maintain a rigid 5-score rolling limit setup backing highest compliance verification outputs protecting standard fairplay natively.
            </p>
          </div>

          {/* Small Card 2: 5 Columns */}
          <div className="glass" style={{
            gridColumn: 'span 5',
            padding: '40px',
            background: '#F9FAFB'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔒</div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Secure Payouts</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: '15px' }}>
              Direct escrow configurations with SSL backed protection framing users.
            </p>
          </div>

          {/* Small Card 3: 4 Columns */}
          <div className="glass" style={{
            gridColumn: 'span 4',
            padding: '32px',
            background: '#F9FAFB',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🤝</div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Independent Selection</h4>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>
              Authority determining what metric supports your allocations.
            </p>
          </div>

          {/* Big Card 4: 8 Columns */}
          <div className="glass" style={{
            gridColumn: 'span 8',
            padding: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(109, 40, 217, 0.03) 100%)'
          }}>
            <div style={{ maxWidth: '400px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📈</div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Performance Analytics</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                Track handicap history dynamic variables utilizing detailed dashboards scaling progression accurately.
              </p>
            </div>
            <div style={{ fontSize: '60px', opacity: 0.15, fontWeight: 800 }}>DASH</div>
          </div>
        </div>
      </section>

      {/* Trust & FAQ Accordions */}
      <section style={{ padding: '80px 5%', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '40px', letterSpacing: '-1px' }}>Frequently Asked Questions</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <details style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, outline: 'none' }}>How do the monthly draws work?</summary>
            <p style={{ color: 'var(--muted)', marginTop: '12px', lineHeight: 1.6, fontSize: '14px' }}>
              Qualified users enter automatic weighing structures supporting direct transparent draws executed monthly natively.
            </p>
          </details>
          <details style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600 }}>Can I change my charity selection at any time?</summary>
            <p style={{ color: 'var(--muted)', marginTop: '12px', lineHeight: 1.6, fontSize: '14px' }}>
              Yes, adjusting charity allocations takes effect immediately from dashboard administration setting controls updates.
            </p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
