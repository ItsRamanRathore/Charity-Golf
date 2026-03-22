import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Terms of Service | Digital Heroes',
  description: 'Terms governing use of the Digital Heroes platform.',
};

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFC' }}>
      <Navbar />

      <section style={{ padding: '72px 5%', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '14px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '40px' }}>
          Effective date: March 22, 2026
        </p>

        <div className="glass" style={{ padding: '28px', background: 'white', display: 'grid', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>1. Eligibility and Accounts</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              You must provide accurate account information and maintain control of your credentials. You are responsible
              for actions taken under your account.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>2. Subscription and Billing</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Access to premium functionality may depend on an active subscription status. Billing cycles, renewals,
              and cancellations are governed by the checkout terms displayed at purchase time.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>3. Draw Participation</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Draw eligibility depends on policy rules such as score submission requirements and account standing.
              Digital Heroes reserves the right to verify outcomes and prevent abuse.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>4. Acceptable Use</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              You agree not to misuse the service, interfere with operations, automate abuse, or submit fraudulent data.
              Violations may lead to suspension or termination.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>5. Liability and Changes</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              The platform is provided on an as-is basis to the extent permitted by law. We may update these terms,
              and continued use after updates constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>6. Contact</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              For legal inquiries, contact: legal@digitalheroes.example
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
