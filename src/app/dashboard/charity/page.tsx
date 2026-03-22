export default function DashboardCharityPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>My Charity</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Manage the charity organization that your subscription supports.</p>

      <div className="glass" style={{ padding: '32px', maxWidth: '600px', background: 'white' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Active Selection: Clean Water Alliance</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          10% of your subscription fees go directly to water sanitation efforts globally.
        </p>
        <button className="btn-secondary">Change Charity</button>
      </div>
    </div>
  );
}
