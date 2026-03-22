import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Privacy Policy | Digital Heroes',
  description: 'How Digital Heroes collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFC' }}>
      <Navbar />

      <section style={{ padding: '72px 5%', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '14px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '40px' }}>
          Effective date: March 22, 2026
        </p>

        <div className="glass" style={{ padding: '28px', background: 'white', display: 'grid', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>1. Data We Collect</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              We collect account details (name, email), profile preferences (charity choice, contribution percentage),
              golf score submissions, and platform usage metadata needed to secure and improve service quality.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>2. How We Use Data</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Data is used to authenticate accounts, provide score-based draw participation, display dashboard insights,
              and operate lawful communications related to account activity.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>3. Data Sharing</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              We do not sell personal data. We share only with essential service providers (such as hosting, authentication,
              and payment partners) under contractual obligations and appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>4. Retention and Security</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              We retain personal data only as long as necessary for service operation, compliance, and dispute resolution.
              Access controls, encrypted transport, and role-based permissions are enforced where applicable.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>5. Your Rights</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Subject to local law, you may request access, correction, deletion, or export of your data. Contact us to
              submit privacy requests and we will respond within the required legal timelines.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>6. Contact</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              For privacy-related inquiries, contact: privacy@digitalheroes.example
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
