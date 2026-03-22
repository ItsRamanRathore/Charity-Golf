import Navbar from '@/components/Navbar';

export default function DrawsPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFC' }}>
      <Navbar />
      
      <section style={{ padding: '80px 5%', textAlign: 'center' }} className="bg-grid">
        <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-2px' }}>Monthly Grand Draws</h1>
        <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, fontSize: '18px' }}>
          Participate in monthly structural pool draws support charity benchmarks tracking verification levels securely.
        </p>

        {/* Live Pool Display */}
        <div className="glass" style={{ padding: '40px', maxWidth: '500px', margin: '40px auto 0', background: 'linear-gradient(135deg, white 0%, rgba(109, 40, 217, 0.02) 100%)' }}>
          <div style={{ color: 'var(--muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Active Pool</div>
          <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent)', margin: '12px 0' }}>$14,580</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div>
            <span>Entries close in 12 days</span>
          </div>
        </div>
      </section>

      {/* Grid: Winners & Criteria absolute overlaps */}
      <section style={{ padding: '60px 5%', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div className="glass" style={{ padding: '32px', background: 'white' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Entry Criteria</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>Subscribers maintain active direct compliance status.</li>
              <li>A minimum of 5 recent accurate scorecard inserts logged verified.</li>
              <li>Handicap verification alignment executed before monthly lock thresholds.</li>
            </ul>
          </div>

          <div className="glass" style={{ padding: '32px', background: 'white' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Recent Payouts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Alex M.</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>April Draw</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>$5,000</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Sarah K.</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>March Draw</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>$4,820</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
