import { supabase } from '@/lib/supabase/public';
import { withTimeout } from '@/lib/performance/query-timeout';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';

type CharityProfile = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  image_url: string | null;
  total_raised: number | null;
  category?: string | null;
  location?: string | null;
  website_url?: string | null;
  upcoming_events?: Array<{ title?: string; date?: string; location?: string }> | null;
};

export default async function CharityProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let charity: CharityProfile | null = null;

  try {
    const result = (await withTimeout(
      supabase
        .from('charities')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
      1800,
      'Charity profile query timeout'
    )) as unknown as { data: CharityProfile | null };

    charity = result.data;
  } catch {
    charity = null;
  }

  if (!charity) {
    return (
      <main style={{ minHeight: '100vh', padding: '60px 5%' }}>
        <Navbar />
        <div className="glass" style={{ marginTop: '40px', background: 'white', padding: '24px', maxWidth: '700px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Charity Not Found</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
            The selected charity profile could not be loaded.
          </p>
          <Link href="/charities" className="btn-secondary">Back to Charities</Link>
        </div>
      </main>
    );
  }

  const events = Array.isArray(charity.upcoming_events) ? charity.upcoming_events : [];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <section style={{ padding: '60px 5%', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <Link href="/charities" className="btn-secondary" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          Back to Charities
        </Link>

        <div className="glass" style={{ background: 'white', overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', height: '280px' }}>
            <Image
              src={charity.image_url || '/images/charity-placeholder.svg'}
              alt={charity.name}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <Image
                src={charity.logo_url || '/images/charity-logo-placeholder.svg'}
                alt={`${charity.name} logo`}
                width={44}
                height={44}
                style={{ borderRadius: '50%' }}
              />
              <h1 style={{ fontSize: '30px', fontWeight: 800 }}>{charity.name}</h1>
            </div>

            <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '16px' }}>
              {charity.description || 'No description available yet.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="glass" style={{ background: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Raised</div>
                <div style={{ fontWeight: 800, fontSize: '20px' }}>INR {Number(charity.total_raised ?? 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="glass" style={{ background: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Category</div>
                <div style={{ fontWeight: 700 }}>{charity.category || 'General Impact'}</div>
              </div>
              <div className="glass" style={{ background: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Location</div>
                <div style={{ fontWeight: 700 }}>{charity.location || 'Global'}</div>
              </div>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Upcoming Events</h2>
            {events.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No upcoming events listed yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {events.map((event, index) => (
                  <div key={`${event.title || 'event'}-${index}`} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
                    <div style={{ fontWeight: 700 }}>{event.title || 'Community Event'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
                      {event.date || 'Date TBA'} {event.location ? `• ${event.location}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                Visit Charity Website
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
