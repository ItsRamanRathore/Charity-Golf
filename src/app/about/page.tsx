import Navbar from '@/components/Navbar';

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFC' }}>
      <Navbar />
      
      {/* Hero */}
      <section style={{ padding: '80px 5%', textAlign: 'center', position: 'relative' }} className="bg-grid">
        <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', background: 'rgba(109, 40, 217, 0.08)', padding: '6px 12px', borderRadius: '20px' }}>
          Our Story
        </span>
        <h1 style={{ fontSize: '48px', fontWeight: 800, marginTop: '16px', marginBottom: '20px', letterSpacing: '-2px' }}>Driven by Purpose.</h1>
        <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, fontSize: '18px' }}>
          We bridge modern performance metrics with verified global cause allocations framing transparent structure support networks.
        </p>
      </section>

      {/* Grid Values Pillars */}
      <section style={{ padding: '60px 5%', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          <div className="glass" style={{ padding: '32px', background: 'white' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⛳</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Core Precision</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>We maintain strict 5-score analytics keeping benchmarks authenticated supporting fair structure grids.</p>
          </div>

          <div className="glass" style={{ padding: '32px', background: 'white' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌱</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Sustained Giving</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>100% transparent tracking back allocations directly flowing supports directly verifying impact weights.</p>
          </div>

          <div className="glass" style={{ padding: '32px', background: 'white' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤝</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Community Anchors</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>Uniting thousands tracking golf metric variables supporting verified charities natively scales correctly.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
