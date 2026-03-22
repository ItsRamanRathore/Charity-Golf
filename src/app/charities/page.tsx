import Navbar from '@/components/Navbar';
import { getSupabasePublicClient } from '@/lib/supabase/public';
import { withTimeout } from '@/lib/performance/query-timeout';
import Link from 'next/link';
import Image from 'next/image';

type Charity = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  image_url: string | null;
  total_raised: number | null;
};

export const revalidate = 60; // Revalidate every minute

// Seed fallback charities if table is empty
const FALLBACK_CHARITIES: Charity[] = [
  {
    id: '1',
    name: 'Clean Water Alliance',
    description: 'Providing clean water access to underserved communities across Africa and Asia.',
    logo_url: '/images/charity-logo-placeholder.svg',
    image_url: '/images/charity-placeholder.svg',
    total_raised: 125000,
  },
  {
    id: '2',
    name: 'Global Education Fund',
    description: 'Supporting educational initiatives and school infrastructure in developing nations.',
    logo_url: '/images/charity-logo-placeholder.svg',
    image_url: '/images/charity-placeholder.svg',
    total_raised: 89750,
  },
  {
    id: '3',
    name: 'Forest Conservation Network',
    description: 'Protecting endangered forests and promoting sustainable reforestation programs globally.',
    logo_url: '/images/charity-logo-placeholder.svg',
    image_url: '/images/charity-placeholder.svg',
    total_raised: 156320,
  },
];

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; featured?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const featuredOnly = params.featured === '1';

  let charityList: Charity[] = FALLBACK_CHARITIES;

  try {
    const supabase = getSupabasePublicClient();
    let request = supabase.from('charities').select('*').order('name');

    if (featuredOnly) {
      request = request.eq('is_featured', true);
    }

    if (query) {
      request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const result = (await withTimeout(
      request,
      1800,
      'Charities query timeout'
    )) as unknown as { data: Charity[] | null };

    if (result.data && result.data.length > 0) {
      charityList = result.data as Charity[];
    }
  } catch (fetchError) {
    console.error('Error fetching charities:', fetchError);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <section style={{ padding: '80px 5%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 800, marginBottom: '16px' }}>
          Our Partner <span style={{ color: 'var(--accent)' }}>Charities</span>
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 60px', lineHeight: 1.6 }}>
          Every subscription supports a cause. Explore the organizations making a real impact on communities and the environment.
        </p>

        <form method="get" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search charities"
            style={{ minWidth: '260px', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--muted)' }}>
            <input type="checkbox" name="featured" value="1" defaultChecked={featuredOnly} />
            Featured only
          </label>
          <button className="btn-secondary" type="submit">Apply</button>
        </form>

        <div className="glass" style={{ background: 'white', padding: '16px', maxWidth: '1200px', margin: '0 auto 26px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Spotlight Charity</div>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>{charityList[0]?.name || 'Clean Water Alliance'}</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>
            {charityList[0]?.description || 'Featured partner making visible impact in communities.'}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {charityList.map((charity) => (
            <div key={charity.id} className="glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                <Image
                  src={charity.image_url || '/images/charity-placeholder.svg'}
                  alt={charity.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Image
                    src={charity.logo_url || '/images/charity-logo-placeholder.svg'}
                    alt={`${charity.name} logo`}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{charity.name}</h3>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px', flexGrow: 1 }}>
                  {charity.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Raised</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent)' }}>${Number(charity.total_raised ?? 0).toLocaleString()}</div>
                  </div>
                  <Link href={`/charities/${charity.id}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
